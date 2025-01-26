import os
import sys
import json
from openai import OpenAI
from dotenv import load_dotenv
from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
)
from pymongo import MongoClient
import gridfs

load_dotenv()
DG_API_KEY = os.getenv("DG_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def retrieve_audio(host, db_name, file, write_path="temp.mp3"):
    client = MongoClient(host)
    db = client[db_name]
    fs = gridfs.GridFS(db)
    audio_file = fs.get(file)
    with open(write_path, 'wb') as f:
        f.write(audio_file.read())

def analyze_audio(filename):
    try:
        deepgram = DeepgramClient(DG_API_KEY)
        with open(filename, "rb") as file:
            buffer_data = file.read()

        payload: FileSource = {
            "buffer": buffer_data,
        }
        options = PrerecordedOptions(
            model="nova-2",
            sentiment=True,
            utterances=True,
            paragraphs=True,
            diarize=True,
            filler_words=True,
        )
        response = deepgram.listen.prerecorded.v("1").transcribe_file(payload, options)
        return json.loads(response.to_json(indent=4))
    except Exception as e:
        return e

def parse_json(json_data):
    confidence = json_data["results"]["channels"][0]["alternatives"][0]["confidence"]
    paragraphs = json_data["results"]["channels"][0]["alternatives"][0]["paragraphs"]
    if confidence < 0.85:
        return "Low confidence"
    return paragraphs

def analyze_transcript(filename, mode="interview", transcript_only=False):
    res = analyze_audio(filename)
    parse = parse_json(res)
    max_tries = 2
    while (parse == "Low confidence"):
        if max_tries <= 0:
            break
        res = analyze_audio(filename)
        parse = parse_json(res)
        max_tries -= 1
    if (max_tries == 0):
        print("Failed to get high confidence transcript")
        return "error"
    transcript = parse["transcript"]
    paragraphs = [{"text":" ".join([j["text"] for j in i["sentences"]]),
                   "speaker":i["speaker"]+1,
                   "start":i["start"],
                   "end":i["end"]} for i in parse["paragraphs"]]
    pauses = [paragraphs[i+1]["start"] - paragraphs[i]["end"] for i in range(len(paragraphs) - 1)]
    pauses = [i - i % 0.01 for i in pauses]
    prompt_modes = {
        "interview" : "Analyze how the interview went, given the following transcript.\n"
    }
    if transcript_only:
        return prompt_modes[mode] + transcript
    processed = ""
    for i in range(len(paragraphs) - 1):
        processed += "Speaker " + str(paragraphs[i]["speaker"]) + ": "
        processed += paragraphs[i]["text"]
        processed += "\n"
        if i != len(paragraphs) - 1:
            if pauses[i] > 0:
                processed += " (pause for " + str(pauses[i]) + " seconds) "
        processed += "\n"
    return prompt_modes[mode] + processed

def llm(prompt, context):
    client = OpenAI()
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "developer", "content": context},
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    return completion.choices[0].message.content

def generate_questions(job_description, context="You are a recruiter for a company that is hiring for a new position.\n\
                        You need to generate questions to ask candidates during the interview process.\n\
                        Write a list of questions that you would ask the candidates, testing keywords from the job description."):
    content = llm(job_description, context)
    return content

def long_form(prompt, context="You give feedback on interviews based on how well they went and the strengths and weaknesses of the interviewee.\n\
        You give feedback in the following format:\n\
            - Summary of the interview, including main topics discussed and how the interview went overall\n\
            - Strengths of the interviewee\n\
            - Areas of improvement for the interviewee\n\
        Write all content, including the summary, strengths, and weaknesses, to be directed towards the interviewee who will read this."):
    return llm(prompt, context)

def short_form(prompt, context="You give feedback on interviews based on how well they went and the strengths and weaknesses of the interviewee.\n\
        You give feedback in the following format, with each section separated by new lines:\n\
            - An exact copy of the section that is referenced, without ellipses or any other modifications, surrounded by double quotes\n\
            - Your feedback, bolded and separated from the quoted section by an unbolded space, tilde, and another space\n\
                Write all content, including the quoted section and feedback, to be directed towards the interviewee who will read this.\n\
        For example, this is how your feedback should be formatted:\n\
            \"What\'s the salary for this job?\" ~ **This question was asked too early, and is inappropriate for the first interview.**\n\
            \"What projects can I expect to take on in this role?\" ~ **This question shows your curiosity for the company, which is great.**"):
    try:
        result = llm(prompt, context)
        result = result.split("\n")  # Split into lines
        result = [i.split(" ~ ") for i in result if " ~ " in i]  # Split valid entries
        result = [{"quote": i[0], "feedback": i[1]} for i in result if len(i) == 2]  # Validate
        result = [{"quote": i["quote"][1:-1], "feedback": i["feedback"][2:-2]} for i in result]
        return result
    except Exception as e:
        print(f"Error in short_form: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    # filename = "Behavioral-Mock-Interview.mp3"
    # filename = "Job-Interview-Poor-Example.mp3"
    filename = os.getcwd() + "/" + sys.stdin.readline().strip()
    # print(json.dumps({"filename": filename}))
    prompt = analyze_transcript(filename)
    long_form = long_form(prompt)
    short_form = short_form(prompt)
    result = {"filename": filename, "long_form": long_form, "short_form": short_form}
    print(json.dumps(result))