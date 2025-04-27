import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { SlidersHorizontal, BarChart3 } from 'lucide-react';

export interface QuizOptions {
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
}

interface QuizOptionsSelectorProps {
  options: QuizOptions;
  onChange: (options: QuizOptions) => void;
}

export default function QuizOptionsSelector({
  options,
  onChange
}: QuizOptionsSelectorProps) {
  const handleDifficultyChange = (value: string) => {
    onChange({
      ...options,
      difficulty: value as 'easy' | 'medium' | 'hard'
    });
  };

  const handleQuestionsChange = (value: number[]) => {
    onChange({
      ...options,
      numQuestions: value[0]
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center mb-3">
              <BarChart3 className="h-4 w-4 mr-2 text-primary" />
              <Label className="text-base font-medium">Difficulty Level</Label>
            </div>
            <RadioGroup
              value={options.difficulty}
              onValueChange={handleDifficultyChange}
              className="flex items-center space-x-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy" className="cursor-pointer">Easy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard" className="cursor-pointer">Hard</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-primary" />
                <Label className="text-base font-medium">Number of Questions</Label>
              </div>
              <span className="text-sm font-medium">{options.numQuestions}</span>
            </div>
            <Slider
              value={[options.numQuestions]}
              min={3}
              max={15}
              step={1}
              onValueChange={handleQuestionsChange}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>3</span>
              <span>15</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 