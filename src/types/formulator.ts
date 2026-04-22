export interface IdentificationData {
  title: string
  responsible: string
  organization: string
  duration: string
}

export interface JustificationData {
  problem: string
  evidence: string
  impact: string
  policy: string
}

export interface ObjectivesData {
  general: string
  specific: string[]
}

export interface TargetAudienceData {
  primary: string
  secondary: string
  estimate: string
}

export interface ActionPlanData {
  activities: string
  methodology: string
}

export interface TimelineData {
  phases: string
  milestones: string
}

export interface IndicatorsFormData {
  results: string[]
  impact: string[]
  quantitative: string[]
}

export interface BudgetItem {
  label: string
  value: string
}

export interface BudgetData {
  items: BudgetItem[]
}

export interface SustainabilityData {
  continuity: string
  partnerships: string
}

export interface GovernanceData {
  management: string
  monitoring: string
  accountability: string
}

export interface FormulatorState {
  identification: IdentificationData
  justification: JustificationData
  objectives: ObjectivesData
  targetAudience: TargetAudienceData
  actionPlan: ActionPlanData
  timeline: TimelineData
  indicators: IndicatorsFormData
  budget: BudgetData
  sustainability: SustainabilityData
  governance: GovernanceData
  visitedSteps: string[]
}

export const EMPTY_FORMULATOR_STATE: FormulatorState = {
  identification: { title: '', responsible: '', organization: '', duration: '' },
  justification: { problem: '', evidence: '', impact: '', policy: '' },
  objectives: { general: '', specific: [''] },
  targetAudience: { primary: '', secondary: '', estimate: '' },
  actionPlan: { activities: '', methodology: '' },
  timeline: { phases: '', milestones: '' },
  indicators: { results: ['', '', ''], impact: ['', '', ''], quantitative: ['', '', ''] },
  budget: { items: [{ label: '', value: '' }] },
  sustainability: { continuity: '', partnerships: '' },
  governance: { management: '', monitoring: '', accountability: '' },
  visitedSteps: [],
}
