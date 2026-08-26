# mcp-un-sdg

UN Sustainable Development Goals (SDG) Indicators MCP — UN Statistics Division.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_goals` | List the 17 UN Sustainable Development Goals (code, title, description). Optionally drill into one goal to get its targets and indicators. |
| `list_indicators` | The queryable catalog of SDG indicators. Each indicator (e.g. "1.1.1") nests its data series with their series codes (e.g. "SI_POV_DAY1"). Use a series code as seriesCode in get_series_data. |
| `list_series` | Flat list of all SDG data series (series code + description + goal/target/indicator it belongs to). Series codes are what you pass to get_series_data. Use this when you want the raw series list rather than the indicator-nested view from list_indicators. |
| `list_geoareas` | List geographic areas with their M49 area codes (e.g. 1 = World, 4 = Afghanistan, 8 = Albania). Pass an M49 code as areaCode in get_series_data. |
| `get_series_data` | Get observations for an SDG series in a geographic area over a time range. seriesCode comes from list_indicators/list_series; areaCode is an M49 code from list_geoareas. Returns { data: [...] } where each observation has value, timePeriodStart, geoAreaName, source, footnotes, etc. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "un-sdg": {
      "url": "https://gateway.pipeworx.io/un-sdg/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/un-sdg/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Un Sdg data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
