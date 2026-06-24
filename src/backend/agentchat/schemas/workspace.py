from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class WorkSpaceAgents(Enum):
    LingSeekAgent: str = "lingseek"

    SimpleAgent: str = "simple"

    WeChatAgent: str = "wechat-agent"


class WorkSpaceSimpleTask(BaseModel):
    query: str
    model_id: str
    session_id: str
    plugins: List[str] = []
    mcp_servers: List[str] = []


class WorkSpaceSessionCreateRequest(BaseModel):
    title: str = ""
    agent: str = WorkSpaceAgents.SimpleAgent.value
    session_id: Optional[str] = None
    contexts: List[dict] = Field(default_factory=list)
