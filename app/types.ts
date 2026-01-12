export interface FailingTest {
  test_id: number;
  prompt: string;
  failure_count: number;
}

export interface HealthMetrics {
  pass_rate: number;
  drift: number;
  models_compared: number;
  regression_score: number;
  worst_failing_tests: FailingTest[];
}

export interface Project {
  id: number;
  name: string;
  domain: string;
}
export interface Run {
  run_id: string;
  model_name: string;
  total_tests: number;
  correct: number;
  incorrect: number;
  prompt_version_id?: string;
}
export interface RunDetail {
  test_id: number;
  prompt: string;
  expected: string;
  output: string;
  score: number;
}