interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * UN Sustainable Development Goals (SDG) Indicators MCP — UN Statistics Division.
 *
 * Keyless public API at https://unstats.un.org/sdgapi/v1/sdg.
 *
 * Workflow for getting data:
 *   1. list_goals       — the 17 SDGs with their targets (browse the framework).
 *   2. list_indicators  — the queryable catalog: indicators and their series codes.
 *   3. list_geoareas    — M49 area codes (1 = World, 4 = Afghanistan, ...).
 *   4. get_series_data  — query observations by SDG series code + M49 area code + time range.
 *
 * Data is queried by SDG **series code** (e.g. "SI_POV_DAY1", from list_indicators)
 * and **M49 area code** (e.g. "1" for World, from list_geoareas), not by goal/target.
 */


const BASE = 'https://unstats.un.org/sdgapi/v1/sdg';
const UA = 'pipeworx-mcp-un-sdg/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'list_goals',
    description:
      'List the 17 UN Sustainable Development Goals (code, title, description). Optionally drill into one goal to get its targets and indicators.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description:
            'Optional goal code 1-17. If set, returns that goal with its nested targets and indicators; otherwise returns all 17 goals.',
        },
      },
    },
  },
  {
    name: 'list_indicators',
    description:
      'The queryable catalog of SDG indicators. Each indicator (e.g. "1.1.1") nests its data series with their series codes (e.g. "SI_POV_DAY1"). Use a series code as seriesCode in get_series_data.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_series',
    description:
      'Flat list of all SDG data series (series code + description + goal/target/indicator it belongs to). Series codes are what you pass to get_series_data. Use this when you want the raw series list rather than the indicator-nested view from list_indicators.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_geoareas',
    description:
      'List geographic areas with their M49 area codes (e.g. 1 = World, 4 = Afghanistan, 8 = Albania). Pass an M49 code as areaCode in get_series_data.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_series_data',
    description:
      'Get observations for an SDG series in a geographic area over a time range. seriesCode comes from list_indicators/list_series; areaCode is an M49 code from list_geoareas. Returns { data: [...] } where each observation has value, timePeriodStart, geoAreaName, source, footnotes, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        seriesCode: { type: 'string', description: 'SDG series code, e.g. "SI_POV_DAY1" (from list_indicators/list_series).' },
        areaCode: { type: 'string', description: 'M49 geographic area code, e.g. "1" for World (from list_geoareas).' },
        timePeriodStart: { type: 'string', description: 'Optional earliest year, e.g. "2010".' },
        timePeriodEnd: { type: 'string', description: 'Optional latest year, e.g. "2020".' },
        pageSize: { type: 'number', description: 'Max observations to return (default 100).' },
      },
      required: ['seriesCode', 'areaCode'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'list_goals': {
      const goal = (args.goal as string | undefined)?.trim();
      if (goal) return sdgGet(`/Goal/${encodeURIComponent(goal)}/Target/List?includechildren=true`);
      return sdgGet('/Goal/List');
    }
    case 'list_indicators':
      return sdgGet('/Indicator/List');
    case 'list_series':
      return sdgGet('/Series/List');
    case 'list_geoareas':
      return sdgGet('/GeoArea/List');
    case 'get_series_data': {
      const seriesCode = reqStr(args, 'seriesCode', '"SI_POV_DAY1"');
      const areaCode = reqStr(args, 'areaCode', '"1" (World)');
      const params = new URLSearchParams({ seriesCode, areaCode });
      const start = (args.timePeriodStart as string | undefined)?.trim();
      const end = (args.timePeriodEnd as string | undefined)?.trim();
      if (start) params.set('timePeriodStart', start);
      if (end) params.set('timePeriodEnd', end);
      const pageSize = typeof args.pageSize === 'number' ? args.pageSize : 100;
      params.set('pageSize', String(pageSize));
      return sdgGet(`/Series/Data?${params.toString()}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function sdgGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`UN SDG: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
