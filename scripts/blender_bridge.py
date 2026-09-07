"""Auditable MCP client for the local authored-asset pipeline.

Usage: python scripts/blender_bridge.py --inspect / --code scripts/model.py
Every connection discovers the target before work and releases it in finally.
"""
import argparse, asyncio, base64, json, os, sys, tomllib
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

def payload(result):
    if result.isError:
        raise RuntimeError(str(result.content))
    if result.structuredContent:
        value = result.structuredContent.get('result', result.structuredContent)
        if isinstance(value, str):
            try: return json.loads(value)
            except ValueError: return value
        return value
    return [c.text for c in result.content if c.type == 'text']

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--inspect', action='store_true')
    parser.add_argument('--schema', nargs='*')
    parser.add_argument('--code')
    parser.add_argument('--batch')
    parser.add_argument('--shot')
    args = parser.parse_args()
    with open(r'C:\Users\jared\.codex\config.toml', 'rb') as f:
        cfg = tomllib.load(f)['mcp_servers']['blender_mcp']
    params = StdioServerParameters(command=cfg['command'], args=cfg.get('args', []), env={**os.environ, **cfg.get('env', {})})
    async with stdio_client(params) as streams:
        async with ClientSession(*streams) as s:
            await s.initialize()
            if args.schema:
                for t in (await s.list_tools()).tools:
                    if t.name in args.schema: print(json.dumps({'tool':t.name,'description':t.description,'schema':t.inputSchema}))
                return
            listing = payload(await s.call_tool('list_blender_instances', {}))
            print('INSTANCES=' + json.dumps(listing))
            ready = [i for i in listing['instances'] if i['status'] == 'ready']
            if len(ready) != 1: raise RuntimeError('Expected one ready Blender instance; no scene operation attempted.')
            try:
                if args.inspect:
                    print('SCENE=' + json.dumps(payload(await s.call_tool('get_scene_info', {'user_prompt':'Inspect scene for Alderwatch authored game asset pipeline.'}))))
                    print('RUNTIME=' + json.dumps(payload(await s.call_tool('get_runtime_automation_context', {}))))
                if args.code:
                    code = Path(args.code).read_text(encoding='utf-8')
                    print('CODE=' + json.dumps(payload(await s.call_tool('execute_blender_code', {'code':code, 'transaction':False, 'timeout_seconds':180, 'user_prompt':'Author and export Blender assets for the Alderwatch medieval survival game.'}))))
                if args.batch:
                    for item in json.loads(Path(args.batch).read_text(encoding='utf-8')):
                        print(item['tool'] + '=' + json.dumps(payload(await s.call_tool(item['tool'], item.get('arguments', {})))))
                if args.shot:
                    result = await s.call_tool('get_viewport_screenshot', {'max_size':1600,'user_prompt':'Verify authored game assets visually.'})
                    for c in result.content:
                        if c.type == 'image':
                            Path(args.shot).write_bytes(base64.b64decode(c.data)); print('IMAGE=' + str(Path(args.shot).resolve()))
            finally:
                print('RELEASE=' + json.dumps(payload(await s.call_tool('release_blender_instance', {}))))

asyncio.run(main())
