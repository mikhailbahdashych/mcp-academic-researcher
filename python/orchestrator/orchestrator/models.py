from pydantic import BaseModel


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    history: list[Message]
