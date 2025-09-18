'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Trophy, BookOpen, Lightbulb } from 'lucide-react';

interface SolutionDisplayProps {
  solution: string;
  xpEarned?: number;
  loading?: boolean;
}

export const SolutionDisplay = ({
  solution,
  xpEarned = 0,
  loading = false,
}: SolutionDisplayProps) => {
  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto" variant="glass">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 animate-pulse">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">🤖 AI Soruyu Çözüyor...</h3>
            <p className="text-foreground-muted">
              Gemini AI şu anda sorunuzu analiz ediyor ve adım adım çözüm hazırlıyor.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <div className="w-2 h-2 bg-primary-solid rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-primary-solid rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-2 h-2 bg-primary-solid rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* XP Reward Card */}
      {xpEarned > 0 && (
        <Card variant="glow" className="text-center animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-success-solid">
                  +{xpEarned} XP Kazandın! 🎉
                </h3>
                <p className="text-foreground-muted">Harika! Bir soru daha çözdün.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solution Card */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-2xl">🤖 AI Çözümü</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose prose-invert max-w-none">
            <div
              className="solution-content text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: solution
                  .replace(/\n/g, '<br/>')
                  .replace(
                    /##\s*(.+?)$/gm,
                    '<h2 class="text-xl font-bold text-primary-solid mt-6 mb-3 flex items-center gap-2">$1</h2>',
                  )
                  .replace(
                    /###\s*(.+?)$/gm,
                    '<h3 class="text-lg font-semibold text-foreground mt-4 mb-2">$1</h3>',
                  )
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-accent-solid">$1</strong>'),
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card variant="float">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-accent-solid mb-2">💡 Öğrenme İpucu</h4>
              <p className="text-foreground-muted">
                Bu çözümü anlayarak benzer soruları kendin çözmeye çalış. Pratik yapmak YKS
                başarının anahtarı! 🎯
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
