import type { StepDef } from './kit'
import { intro } from './intro'
import { translations } from './translations'
import { dilations } from './dilations'
import { reflections } from './reflections'
import { wrap } from './wrap'

export const steps: StepDef[] = [...intro, ...translations, ...dilations, ...reflections, ...wrap]
