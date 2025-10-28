'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { MCPTool } from '@/lib/types';

interface MCPToolTesterProps {
  tools: MCPTool[];
  onCallTool: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
}

export function MCPToolTester({ tools, onCallTool }: MCPToolTesterProps) {
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [argsInput, setArgsInput] = useState('{}');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  const handleRun = async () => {
    if (!selectedTool) {
      setError('Tool을 선택하세요.');
      return;
    }

    setIsRunning(true);
    setError('');
    setResult(null);

    try {
      const args = JSON.parse(argsInput);
      const toolResult = await onCallTool(selectedTool, args);
      setResult(toolResult);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('JSON 형식이 올바르지 않습니다.');
      } else {
        setError(err instanceof Error ? err.message : 'Tool 실행 실패');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const selectedToolData = tools.find((t) => t.name === selectedTool);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tool-select">Tool 선택</Label>
        <Select value={selectedTool} onValueChange={setSelectedTool}>
          <SelectTrigger id="tool-select">
            <SelectValue placeholder="Tool을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {tools.map((tool) => (
              <SelectItem key={tool.name} value={tool.name}>
                {tool.name}
                {tool.description && ` - ${tool.description}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedToolData && (
        <Card className="p-4 bg-muted">
          <h4 className="font-semibold mb-2">Input Schema</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(selectedToolData.inputSchema, null, 2)}
          </pre>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="args-input">인자 (JSON)</Label>
        <Textarea
          id="args-input"
          value={argsInput}
          onChange={(e) => setArgsInput(e.target.value)}
          placeholder='{"key": "value"}'
          rows={6}
          className="font-mono text-sm"
        />
      </div>

      <Button onClick={handleRun} disabled={isRunning || !selectedTool}>
        <Play className="w-4 h-4 mr-2" />
        {isRunning ? '실행 중...' : '실행'}
      </Button>

      {error && (
        <Card className="p-4 bg-destructive/10 text-destructive">
          <h4 className="font-semibold mb-2">오류</h4>
          <p className="text-sm">{error}</p>
        </Card>
      )}

      {result !== undefined && result !== null && (
        <Card className="p-4 bg-card">
          <h4 className="font-semibold mb-2">결과</h4>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

