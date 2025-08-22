from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app) 


API_KEY = ""
genai.configure(api_key=API_KEY)
# Initialize the Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')


@app.route('/optimize-prompt', methods=['POST'])
def optimize_prompt():
    """
    Receives a rough prompt and uses the LLM to rewrite it into a
    structured, high-quality prompt.
    """
    if not request.json or 'prompt' not in request.json:
        return jsonify({'error': 'Missing prompt'}), 400

    original_prompt = request.json['prompt']

    
    instructional_prompt = f"""
You are an expert prompt engineer. Your task is to take a user's rough, unclear, or poorly written idea and rewrite it into a clear, structured, and effective prompt.

Analyze the user's input below to understand their underlying goal. Then, rewrite it into a new, high-quality prompt that follows this exact structure, filling in the details based on their request:

**Goal:**
[A clear, one-sentence objective]

**Return Format:**
[Specific instructions on how the output should be structured]

**Warnings:**
[Constraints or things the AI should avoid]

**Context Dump:**
[Any relevant background information provided by the user]

---
USER'S ROUGH PROMPT:
'{original_prompt}'
---

Only return the rewritten, structured prompt. Do not add any other commentary.
"""

    try:
        response = model.generate_content(instructional_prompt)
        optimized_prompt = response.text.strip()
        return jsonify({'optimized_prompt': optimized_prompt})
    except Exception as e:
        print(f"Error during prompt optimization: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get-response', methods=['POST'])
def get_response():
    """
    Receives an optimized prompt and gets the final response from the LLM.
    """
    if not request.json or 'prompt' not in request.json:
        return jsonify({'error': 'Missing prompt'}), 400

    optimized_prompt = request.json['prompt']
    
    try:
        # Start a chat session to maintain context if needed
        chat = model.start_chat(history=[])
        response = chat.send_message(optimized_prompt)
        return jsonify({'response': response.text.strip()})
    except Exception as e:
        print(f"Error during chat response generation: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    
    app.run(debug=True, port=5000)
