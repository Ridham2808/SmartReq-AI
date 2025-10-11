import json
import subprocess
import sys


def run_script(payload: dict) -> dict:
  proc = subprocess.run(
    [sys.executable, 'python/nlp_processor.py', '--stdin'],
    input=json.dumps(payload).encode('utf-8'),
    capture_output=True
  )
  assert proc.returncode == 0, proc.stderr.decode()
  return json.loads(proc.stdout.decode())


def test_basic_output():
  out = run_script({"input_text": "As a user I want to login so that I can view balance", "project_type": "fintech"})
  assert 'stories' in out and isinstance(out['stories'], list)
  assert 'flow' in out and isinstance(out['flow'], dict)
  assert 'nodes' in out['flow'] and 'edges' in out['flow']
  assert 'confidence' in out and isinstance(out['confidence'], (int, float))
