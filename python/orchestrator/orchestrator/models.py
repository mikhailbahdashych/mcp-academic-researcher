from pydantic import BaseModel


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ForceTool(BaseModel):
    name: str
    args: dict


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    history: list[Message]
    force_tool: ForceTool | None = None
