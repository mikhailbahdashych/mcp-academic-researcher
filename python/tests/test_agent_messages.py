"""Tests for the pure message-construction helpers in ``agent.py``.

These cover the two decisions the provider adapters depend on — that every tool
result is paired with the assistant tool call that produced it, and which search
tools a request's ``sources`` filter selects — without spawning MCP servers or
touching an LLM.
"""

import json

from orchestrator.agent import _build_tool_exchange, _select_search_tools

AVAILABLE = {"search_arxiv", "search_openalex", "search_notes", "save_note"}


def test_build_tool_exchange_pairs_the_call_with_its_result():
    assistant, tool = _build_tool_exchange("search_arxiv", {"query": "llm"}, ["r1", "r2"])

    assert assistant["role"] == "assistant"
    assert assistant["content"] == ""
    call = assistant["tool_calls"][0]
    assert call["function"] == {"name": "search_arxiv", "arguments": {"query": "llm"}}

    assert tool["role"] == "tool"
    assert tool["name"] == "search_arxiv"
    assert tool["tool_call_id"] == call["id"]
    assert json.loads(tool["content"]) == ["r1", "r2"]


def test_build_tool_exchange_mints_a_fresh_id_each_time():
    first, _ = _build_tool_exchange("search_arxiv", {}, [])
    second, _ = _build_tool_exchange("search_arxiv", {}, [])
    assert first["tool_calls"][0]["id"] != second["tool_calls"][0]["id"]


def test_select_search_tools_without_sources_uses_both():
    assert _select_search_tools(None, AVAILABLE) == ["search_arxiv", "search_openalex"]


def test_select_search_tools_honours_a_single_source():
    assert _select_search_tools(["arxiv"], AVAILABLE) == ["search_arxiv"]
    assert _select_search_tools(["openalex"], AVAILABLE) == ["search_openalex"]


def test_select_search_tools_ignores_unknown_sources():
    assert _select_search_tools(["pubmed"], AVAILABLE) == []
    assert _select_search_tools(["arxiv", "pubmed"], AVAILABLE) == ["search_arxiv"]


def test_select_search_tools_matches_sources_loosely():
    """Casing and stray whitespace come from a UI, not from our own constants."""
    assert _select_search_tools([" ArXiv "], AVAILABLE) == ["search_arxiv"]
    assert _select_search_tools(["OPENALEX"], AVAILABLE) == ["search_openalex"]


def test_select_search_tools_with_no_sources_selects_nothing():
    assert _select_search_tools([], AVAILABLE) == []


def test_select_search_tools_skips_tools_the_servers_do_not_offer():
    assert _select_search_tools(None, {"search_openalex"}) == ["search_openalex"]
