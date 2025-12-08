import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Analysis {
  _id: string;
  gameId: string;
  accuracy: number;
  mistakes: number;
  blunders: number;
  bestMoves: number;
  evaluation: number;
  createdAt: string;
}

export default function Analysis() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadAnalysis();
    }
  }, [gameId]);

  const loadAnalysis = async () => {
    if (!gameId) return;
    try {
      const data = await apiService.getGameAnalysis(gameId);
      setAnalysis(data.analysis || data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load analysis');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!gameId) return;
    setIsAnalyzing(true);
    try {
      await apiService.analyzeGame(gameId, {});
      toast.success('Analysis started! This may take a moment.');
      setTimeout(loadAnalysis, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} size="md">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Game Analysis</h1>
            <p className="text-text-secondary">Detailed analysis of your game</p>
          </div>
        </div>
        {!analysis && (
          <Button onClick={handleAnalyze} isLoading={isAnalyzing} size="lg">
            <BarChart3 className="w-4 h-4" />
            Analyze Game
          </Button>
        )}
      </div>

      {!analysis ? (
        <Card>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Analysis Available</h3>
            <p className="text-text-secondary mb-6">
              Analyze this game to see detailed statistics, mistakes, and best moves.
            </p>
            <Button onClick={handleAnalyze} isLoading={isAnalyzing} size="lg">
              <BarChart3 className="w-4 h-4" />
              Start Analysis
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Accuracy */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Accuracy</p>
                <p className="text-3xl font-semibold text-primary">{analysis.accuracy}%</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          {/* Mistakes */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Mistakes</p>
                <p className="text-3xl font-semibold text-accent">{analysis.mistakes}</p>
              </div>
              <div className="w-12 h-12 bg-accent-light rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>

          {/* Blunders */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Blunders</p>
                <p className="text-3xl font-semibold text-danger">{analysis.blunders}</p>
              </div>
              <div className="w-12 h-12 bg-danger-light rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-danger" />
              </div>
            </div>
          </Card>

          {/* Best Moves */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Best Moves</p>
                <p className="text-3xl font-semibold text-success">{analysis.bestMoves}</p>
              </div>
              <div className="w-12 h-12 bg-success-light rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {analysis && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Analysis Details</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <span className="text-text-secondary">Final Evaluation</span>
              <span className="text-lg font-semibold text-text-primary">
                {analysis.evaluation > 0 ? '+' : ''}
                {analysis.evaluation.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <span className="text-text-secondary">Analysis Date</span>
              <span className="text-text-primary">
                {new Date(analysis.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

