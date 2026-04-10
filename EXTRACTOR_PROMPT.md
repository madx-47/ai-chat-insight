# Extractor Prompt

I need you to export this entire conversation as structured JSONL 
Give the FULL conversation from the very first message up to (but NOT including) this instruction message.

OUTPUT REQUIREMENTS
- Return ONLY raw JSONL
- One JSON object per line
- No markdown
- No explanations
- No code fences
- No extra text before or after

GENERAL RULES
- Every message in this conversation must produce exactly one record
- Use the SAME sessionId for all records
- Generate a UNIQUE deterministic sessionId
- Format: "sess-YYYYMMDD-HHMMSS-MSGCOUNT-HASH"
- YYYYMMDD-HHMMSS = CURRENT local time
- MSGCOUNT = total number of messages in conversation
- HASH = first 6 hexadecimal characters of a hash of (first user message text + last user message text)
- Hash may be SHA1, MD5, or any deterministic hash
- uuid must be sequential: "rec-001", "rec-002", ...
- parentUuid = previous record uuid (first record = null)
- Use ISO-8601 timestamps
- If timestamps are unknown, start from CURRENT local time
- Space each message exactly 2 minutes apart

MESSAGE CONTENT RULES
- Preserve ORIGINAL message text exactly whenever possible
- If ASSISTANT message length > 1200 characters → summarize it
- Summaries must:
  - retain instructions and constraints
  - retain schemas
  - retain decisions
  - retain technical meaning
  - be concise but complete
- Prefix summarized assistant messages with: "[ASSISTANT SUMMARY]"

- If message contains code blocks:
  - Keep surrounding text unchanged
  - Replace ONLY code block content with:
    "[CODE SUMMARY: <technical description>]"
  - Preserve language if known
  - Preserve key logic, functions, and intent
- Multiple code blocks → summarize each individually
- Do NOT alter formatting outside code blocks

- OPTIONAL ANALYSIS NOTE:
  If user prompts show improvement opportunities,
  append at end of assistant message:
  "[PROMPT FEEDBACK: pros..., cons..., suggested improvement...]"
  Keep this concise and under 200 characters.

RECORD SCHEMA:

USER MESSAGE
{"uuid":"<id>","parentUuid":"<prev-id or null>","sessionId":"<session-id>","timestamp":"<ISO>","type":"user","message":{"role":"user","parts":[{"text":"<message text>"}]}}

ASSISTANT MESSAGE
{"uuid":"<id>","parentUuid":"<prev-id>","sessionId":"<session-id>","timestamp":"<ISO>","type":"assistant","message":{"role":"model","parts":[{"text":"<message text>"}]}}

TOOL USAGE (append inside assistant parts array)
{"functionCall":{"id":"<tool-call-id>","name":"<tool_name>","args":{}}}

TOOL RESULT (separate record)
{"uuid":"<id>","parentUuid":"<prev-id>","sessionId":"<session-id>","timestamp":"<ISO>","type":"tool_result","toolCallResult":{"callId":"<tool-call-id>","status":"success","resultDisplay":"<short summary>"}}

