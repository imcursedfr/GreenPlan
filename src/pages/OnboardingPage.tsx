/** /onboarding — polished multi-step wizard producing a validated PlannerProfile. */
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BatteryCharging,
  CloudRain,
  Droplets,
  Gauge,
  Home,
  Leaf,
  MapPin,
  Recycle,
  Sprout,
  Sun,
  Wind,
  Zap,
} from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { WizardShell, type WizardStepDef } from '../components/onboarding/WizardShell'
import { LocationSearch } from '../components/onboarding/LocationSearch'
import { NumberSlider } from '../components/onboarding/NumberSlider'
import {
  FieldLabel,
  MultiOptionCard,
  OptionCard,
  SliderField,
} from '../components/onboarding/fields'
import { Badge } from '../components/ui/Badge'
import { useProfile } from '../hooks/useProfile'
import { useHomes } from '../hooks/useHomes'
import { searchLocation, type GeocodedLocation } from '../services/geocodingService'
import { regionFromCountry, formatRegionCurrency } from '../lib/region'
import { convertToUsd, fxPerUsd } from '../lib/format'
import type { PlannerProfile } from '../types/profile'
import type {
  ClimateZone,
  CoolingUsageLevel,
  ExistingMeasure,
  RoofOrientation,
  RoofType,
} from '../types'

const steps: WizardStepDef[] = [
  { id: 'location', title: 'Location', description: 'Where is your home? Climate drives solar, water and efficiency math.' },
  { id: 'home', title: 'Your home', description: 'Size, occupants and roof — the basis for capacity estimates.' },
  { id: 'roof', title: 'Roof', description: 'Roof type and orientation shape your solar potential.' },
  { id: 'energy', title: 'Electricity', description: 'Monthly usage or bill — enough to size solar and savings.' },
  { id: 'water', title: 'Water', description: 'Monthly water use and outdoor needs for rainwater planning.' },
  { id: 'cooling', title: 'Cooling', description: 'How hard your AC works determines efficiency upside.' },
  { id: 'measures', title: 'Already done', description: 'Existing sustainability measures — we skip what you already have.' },
  { id: 'budget', title: 'Budget', description: 'Optional budget so recommendations respect what you can spend.' },
]

const climateZones: Array<{ id: ClimateZone; label: string; description: string }> = [
  { id: 'tropical', label: 'Tropical', description: 'Hot & humid year-round' },
  { id: 'arid', label: 'Arid / Desert', description: 'Hot days, little rain' },
  { id: 'temperate', label: 'Temperate', description: 'Mild seasons' },
  { id: 'continental', label: 'Continental', description: 'Hot summers, cold winters' },
  { id: 'polar', label: 'Cool / Northern', description: 'Short cool summers' },
]

const roofTypes: Array<{ id: RoofType; label: string }> = [
  { id: 'gable', label: 'Gable (pitched)' },
  { id: 'hip', label: 'Hip (pitched)' },
  { id: 'shed', label: 'Shed / single slope' },
  { id: 'flat', label: 'Flat' },
  { id: 'unknown', label: 'Not sure' },
]

const orientations: Array<{ id: RoofOrientation; label: string; hint: string }> = [
  { id: 'south', label: 'South', hint: 'Best yield' },
  { id: 'southeast', label: 'South-east', hint: 'Very good' },
  { id: 'southwest', label: 'South-west', hint: 'Very good' },
  { id: 'east', label: 'East', hint: 'Good (morning sun)' },
  { id: 'west', label: 'West', hint: 'Good (afternoon sun)' },
  { id: 'flat', label: 'Flat roof', hint: 'Racked optimally' },
  { id: 'north', label: 'North', hint: 'Weakest yield' },
  { id: 'unknown', label: 'Not sure', hint: 'Average assumed' },
]

const coolingLevels: Array<{ id: CoolingUsageLevel; label: string; description: string }> = [
  { id: 'none', label: 'None', description: 'No air conditioning' },
  { id: 'low', label: 'A few weeks/yr', description: 'Only during heat waves' },
  { id: 'moderate', label: 'Regular summer use', description: 'Most hot days' },
  { id: 'high', label: 'Heavy use', description: 'Most of the year' },
]

const measureOptions: Array<{ id: ExistingMeasure; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'rooftop-solar', label: 'Rooftop solar', description: 'PV panels already installed', icon: Sun },
  { id: 'attic-insulation', label: 'Attic insulation', description: 'Upgraded roof/attic insulation', icon: Home },
  { id: 'double-glazing', label: 'Double glazing', description: 'Insulated windows', icon: Wind },
  { id: 'efficient-ac', label: 'Efficient AC', description: 'Modern inverter / high-SEER unit', icon: Gauge },
  { id: 'smart-thermostat', label: 'Smart thermostat', description: 'Programmable schedules', icon: BatteryCharging },
  { id: 'led-lighting', label: 'LED lighting', description: 'Mostly LED bulbs', icon: Zap },
  { id: 'rainwater-tank', label: 'Rainwater tank', description: 'Storage already installed', icon: CloudRain },
  { id: 'composting', label: 'Composting', description: 'Food/garden waste composted', icon: Sprout },
  { id: 'recycling-program', label: 'Recycling program', description: 'Regular recycling pickup', icon: Recycle },
]

interface Draft {
  locationRawQuery: string
  resolved: GeocodedLocation | null
  climateZone?: ClimateZone
  floorAreaSqm?: number
  householdSize: number
  roofAreaSqm?: number
  roofType?: RoofType
  roofOrientation?: RoofOrientation
  monthlyElectricityKwh?: number
  monthlyBillAmount?: number
  monthlyWaterM3?: number
  hasGarden: boolean
  coolingUsageLevel?: CoolingUsageLevel
  existingMeasures: ExistingMeasure[]
  sustainabilityBudget?: number
}

const initialDraft: Draft = {
  locationRawQuery: '',
  resolved: null,
  householdSize: 3,
  hasGarden: false,
  existingMeasures: [],
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { profile, saveProfile, persistenceMode, supabaseConfigured } = useProfile()
  const { syncActiveHomeFromProfile } = useHomes()
  const [currentStep, setCurrentStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(() => profileToDraft(profile))
  const [submitting, setSubmitting] = useState(false)
  // Ref guard: double-clicks on "Create my plan" must not create duplicate homes.
  const finishingRef = useRef(false)

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }))

  // Region is derived from resolved geocoding, with manual override.
  const region = useMemo(
    () => regionFromCountry(draft.resolved?.countryCode),
    [draft.resolved?.countryCode],
  )

  // ── Step validation ───────────────────────────────────────────────────────
  const stepValid = useMemo(() => {
    switch (steps[currentStep].id) {
      case 'location':
        return draft.climateZone !== undefined
      case 'home':
        return (draft.floorAreaSqm ?? 0) > 5 && (draft.householdSize ?? 0) > 0
      case 'roof':
        return (draft.roofAreaSqm ?? 0) > 3
      case 'energy':
        return (draft.monthlyElectricityKwh ?? 0) > 0 || (draft.monthlyBillAmount ?? 0) > 0
      case 'water':
        return true // water is optional
      case 'cooling':
        return draft.coolingUsageLevel !== undefined
      case 'measures':
        return true
      case 'budget':
        return true
      default:
        return false
    }
  }, [currentStep, draft])

  const nextHint = !stepValid
    ? steps[currentStep].id === 'location'
      ? 'Pick a climate zone to continue'
      : 'Complete the highlighted fields to continue'
    : undefined

  const finish = async () => {
    if (finishingRef.current) return
    finishingRef.current = true
    setSubmitting(true)
    const resolved = draft.resolved
    const completeProfile: PlannerProfile = {
      home: {
        locationLabel:
          (resolved?.formatted ?? draft.locationRawQuery) || undefined,
        locationRawQuery: draft.locationRawQuery || undefined,
        latitude: resolved?.latitude,
        longitude: resolved?.longitude,
        geocodedCountry: resolved?.country,
        geocodedCountryCode: resolved?.countryCode,
        geocodedState: resolved?.state,
        geocodedCity: resolved?.city,
        geocodedPostcode: resolved?.postcode,
        regionCode: region.code,
        climateZone: draft.climateZone,
        floorAreaSqm: draft.floorAreaSqm,
        householdSize: draft.householdSize,
        roofAreaSqm: draft.roofAreaSqm,
        roofType: draft.roofType,
        roofOrientation: draft.roofOrientation,
        coolingUsageLevel: draft.coolingUsageLevel,
        existingMeasures: draft.existingMeasures,
        // Stored USD-canonical; converted back at display time.
        sustainabilityBudget:
          draft.sustainabilityBudget !== undefined
            ? convertToUsd(draft.sustainabilityBudget, region.currency)
            : undefined,
        budgetCurrency: region.currency,
      },
      energy: {
        monthlyElectricityKwh: draft.monthlyElectricityKwh,
        // Bill amount is stored USD-canonical so engine tariff math stays
        // consistent; convert from the user's typed regional currency.
        monthlyBillAmount:
          draft.monthlyBillAmount !== undefined
            ? convertToUsd(draft.monthlyBillAmount, region.currency)
            : undefined,
        currency: region.currency,
      },
      water: {
        monthlyWaterM3: draft.monthlyWaterM3,
        hasGarden: draft.hasGarden,
      },
      updatedAt: new Date().toISOString(),
    }
    try {
      await saveProfile(completeProfile)
      // Attach the finished profile to the active home (or create one), so
      // multi-home state, dashboard and planner all use this data.
      await syncActiveHomeFromProfile(completeProfile)
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
      finishingRef.current = false
    }
  }

  return (
    <PageShell>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="brand" className="mb-3">
            <Leaf className="size-3.5" aria-hidden />
            Home setup
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-strong">
            Build your home profile
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            Every answer feeds auditable calculations — solar capacity, rainwater potential,
            efficiency savings and more. Takes about two minutes.
          </p>
        </div>
        {persistenceMode && (
          <Badge tone={supabaseConfigured ? 'brand' : 'neutral'}>
            {supabaseConfigured ? 'Saved to Supabase' : 'Demo mode — saved locally'}
          </Badge>
        )}
      </div>

      <WizardShell
        steps={steps}
        currentStep={currentStep}
        nextDisabled={!stepValid || submitting}
        nextHint={nextHint}
        onNext={() => setCurrentStep((step) => Math.min(step + 1, steps.length - 1))}
        onBack={() => setCurrentStep((step) => Math.max(step - 1, 0))}
        onFinish={() => void finish()}
      >
        {steps[currentStep].id === 'location' && (
          <LocationStep draft={draft} update={update} region={region} />
        )}
        {steps[currentStep].id === 'home' && <HomeStep draft={draft} update={update} region={region} />}
        {steps[currentStep].id === 'roof' && <RoofStep draft={draft} update={update} region={region} />}
        {steps[currentStep].id === 'energy' && <EnergyStep draft={draft} update={update} region={region} />}
        {steps[currentStep].id === 'water' && <WaterStep draft={draft} update={update} region={region} />}
        {steps[currentStep].id === 'cooling' && <CoolingStep draft={draft} update={update} />}
        {steps[currentStep].id === 'measures' && <MeasuresStep draft={draft} update={update} />}
        {steps[currentStep].id === 'budget' && <BudgetStep draft={draft} update={update} region={region} />}
      </WizardShell>
    </PageShell>
  )
}

// ── Steps ────────────────────────────────────────────────────────────────────

type StepProps = { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }
type Region = ReturnType<typeof regionFromCountry>

function LocationStep({ draft, update, region }: StepProps & { region: Region }) {
  const [autoClimate, setAutoClimate] = useState(false)

  const handleSelect = (location: GeocodedLocation) => {
    update('resolved', location)
    update('locationRawQuery', location.rawQuery ?? location.formatted)
    setAutoClimate(true)
    // Infer a climate zone from real geocoded coordinates (deterministic rules,
    // never AI). Latitude bands: tropical <23.5, arid band heuristics by
    // latitude only — the user can always override.
    const abs = Math.abs(location.latitude)
    let zone: ClimateZone = 'temperate'
    if (abs < 23.5) zone = 'tropical'
    else if (abs < 35) zone = 'arid'
    else if (abs < 55) zone = 'continental'
    else zone = 'polar'
    update('climateZone', zone)
  }

  const handleManual = (text: string) => {
    update('resolved', null)
    update('locationRawQuery', text)
  }

  return (
    <div className="space-y-5">
      <LocationSearch
        value={draft.resolved}
        onSelect={handleSelect}
        onManualText={handleManual}
        onClear={() => {
          update('resolved', null)
          update('locationRawQuery', '')
        }}
      />
      {draft.resolved && (
        <div className="rounded-xl border border-border-base bg-surface-muted/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-text-strong">
            <MapPin className="size-4 text-brand" aria-hidden />
            Location resolved
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-muted sm:grid-cols-3">
            {[
              ['Country', draft.resolved.country],
              ['Region', draft.resolved.state],
              ['City', draft.resolved.city],
              ['Postal', draft.resolved.postcode],
              ['Coordinates', `${draft.resolved.latitude.toFixed(3)}, ${draft.resolved.longitude.toFixed(3)}`],
              ['Currency', `${region.currencySymbol} (${region.currency})`],
            ].map(([label, val]) =>
              val ? (
                <div key={label}>
                  <dt className="font-medium text-text-body">{label}</dt>
                  <dd className="truncate">{val}</dd>
                </div>
              ) : null,
            )}
          </dl>
          {autoClimate && (
            <p className="mt-2 text-xs text-text-faint">
              Climate zone pre-filled from your location — adjust below if it doesn't match.
            </p>
          )}
        </div>
      )}
      <div>
        <FieldLabel tooltip="Climate drives rainfall, solar yield and cooling assumptions.">
          Which climate is your home in?
        </FieldLabel>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {climateZones.map((zone) => (
            <OptionCard
              key={zone.id}
              selected={draft.climateZone === zone.id}
              onClick={() => update('climateZone', zone.id)}
              title={zone.label}
              description={zone.description}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function HomeStep({ draft, update, region }: StepProps & { region: Region }) {
  return (
    <div className="space-y-6">
      <NumberSlider
        label="Home size (floor area)"
        value={draft.floorAreaSqm}
        onChange={(value) => update('floorAreaSqm', value)}
        min={20}
        max={region.code === 'IN' ? 1500 : 1000}
        step={region.areaUnit === 'sq ft' ? 50 : 5}
        unit={region.areaUnit}
        largeValues
        toDisplay={region.areaUnit === 'sq ft' ? (v) => v * region.areaFactor : undefined}
        fromDisplay={region.areaUnit === 'sq ft' ? (v) => v / region.areaFactor : undefined}
        format={(v) => {
          const display = region.areaUnit === 'sq ft' ? v * region.areaFactor : v
          return `${new Intl.NumberFormat('en-US').format(Math.round(display))} ${region.areaUnit}`
        }}
        hint="Conditioned living area — used for the efficiency intensity benchmark."
      />
      <SliderField
        label="People in your household"
        value={draft.householdSize ?? 3}
        onChange={(value) => update('householdSize', value)}
        min={1}
        max={12}
        format={(value) => (value === 1 ? '1 person' : `${value} people`)}
        hint="Drives water and waste estimates."
      />
    </div>
  )
}

function RoofStep({ draft, update, region }: StepProps & { region: Region }) {
  return (
    <div className="space-y-6">
      <NumberSlider
        label="Usable roof area"
        value={draft.roofAreaSqm}
        onChange={(value) => update('roofAreaSqm', value)}
        min={5}
        max={region.code === 'IN' ? 1200 : 800}
        step={region.areaUnit === 'sq ft' ? 25 : 5}
        unit={region.areaUnit}
        largeValues
        toDisplay={region.areaUnit === 'sq ft' ? (v) => v * region.areaFactor : undefined}
        fromDisplay={region.areaUnit === 'sq ft' ? (v) => v / region.areaFactor : undefined}
        format={(v) => {
          const display = region.areaUnit === 'sq ft' ? v * region.areaFactor : v
          return `${new Intl.NumberFormat('en-US').format(Math.round(display))} ${region.areaUnit}`
        }}
        hint="Rough plan-view area of roof planes that could host panels. Not sure? Footprint × 0.7 is a good guess."
      />
      <div>
        <FieldLabel tooltip="Affects panel layout and usable area.">Roof type</FieldLabel>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
          {roofTypes.map((type) => (
            <OptionCard
              key={type.id}
              selected={draft.roofType === type.id}
              onClick={() => update('roofType', type.id)}
              title={type.label}
            />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel tooltip="South-facing roofs (northern hemisphere) get the best solar yield.">
          Main roof orientation
        </FieldLabel>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-4">
          {orientations.map((orientation) => (
            <OptionCard
              key={orientation.id}
              selected={draft.roofOrientation === orientation.id}
              onClick={() => update('roofOrientation', orientation.id)}
              title={orientation.label}
              description={orientation.hint}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function EnergyStep({ draft, update, region }: StepProps & { region: Region }) {
  return (
    <div className="space-y-6">
      <NumberSlider
        label="Monthly electricity use"
        value={draft.monthlyElectricityKwh}
        onChange={(value) => update('monthlyElectricityKwh', value)}
        min={50}
        max={4000}
        step={50}
        unit="kWh"
        largeValues
        hint="From your utility bill. High-consumption households welcome — type any exact value."
      />
      <div className="flex items-center gap-3 text-xs text-text-faint">
        <span className="h-px flex-1 bg-border-base" /> or <span className="h-px flex-1 bg-border-base" />
      </div>
      <NumberSlider
        label="Monthly electricity bill"
        value={draft.monthlyBillAmount}
        onChange={(value) => update('monthlyBillAmount', value)}
        min={100}
        max={region.code === 'IN' ? 100000 : 2000}
        step={region.code === 'IN' ? 500 : 10}
        unit={region.currencySymbol}
        largeValues
        // User types regional currency; the draft holds canonical USD.
        toDisplay={region.currency !== 'USD' ? (v) => v * fxPerUsd(region.currency) : undefined}
        fromDisplay={region.currency !== 'USD' ? (v) => v / fxPerUsd(region.currency) : undefined}
        format={(v) => formatRegionCurrency(v, region)}
        hint="Used to derive your tariff when usage is unknown."
      />
    </div>
  )
}

function WaterStep({ draft, update, region }: StepProps & { region: Region }) {
  return (
    <div className="space-y-6">
      <NumberSlider
        label="Monthly water use"
        value={draft.monthlyWaterM3}
        onChange={(value) => update('monthlyWaterM3', value)}
        min={1}
        max={60}
        step={1}
        unit={region.waterUnit === 'gal' ? 'm³ (gal)' : 'm³'}
        largeValues
        format={(v) =>
          region.waterUnit === 'gal'
            ? `${new Intl.NumberFormat('en-US').format(Math.round(v * 264.172))} gal`
            : `${new Intl.NumberFormat('en-US').format(Math.round(v * 1000))} L`
        }
        hint="On your water bill (1 m³ = 1,000 litres ≈ 264 gal). Optional — rainwater math is skipped without it."
      />
      <MultiOptionCard
        selected={draft.hasGarden}
        onToggle={() => update('hasGarden', !draft.hasGarden)}
        icon={Droplets}
        title="I have a garden / lawn"
        description="Irrigation is the biggest rainwater win — harvested water can cover most of it."
      />
    </div>
  )
}

function CoolingStep({ draft, update }: StepProps) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {coolingLevels.map((level) => (
        <OptionCard
          key={level.id}
          selected={draft.coolingUsageLevel === level.id}
          onClick={() => update('coolingUsageLevel', level.id)}
          title={level.label}
          description={level.description}
        />
      ))}
    </div>
  )
}

function MeasuresStep({ draft, update }: StepProps) {
  const toggle = (id: ExistingMeasure) => {
    const next = draft.existingMeasures.includes(id)
      ? draft.existingMeasures.filter((measure) => measure !== id)
      : [...draft.existingMeasures, id]
    update('existingMeasures', next)
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {measureOptions.map((option) => (
        <MultiOptionCard
          key={option.id}
          selected={draft.existingMeasures.includes(option.id)}
          onToggle={() => toggle(option.id)}
          icon={option.icon}
          title={option.label}
          description={option.description}
        />
      ))}
    </div>
  )
}

function BudgetStep({ draft, update, region }: StepProps & { region: Region }) {
  return (      <NumberSlider
        label="Approximate sustainability budget (optional)"
        value={draft.sustainabilityBudget}
        onChange={(value) => update('sustainabilityBudget', value)}
        min={0}
        max={region.code === 'IN' ? 5_000_000 : 200_000}
        step={region.code === 'IN' ? 25_000 : 1_000}
        unit={region.currencySymbol}
        largeValues
        // User types regional currency; the draft holds canonical USD.
        toDisplay={region.currency !== 'USD' ? (v) => v * fxPerUsd(region.currency) : undefined}
        fromDisplay={region.currency !== 'USD' ? (v) => v / fxPerUsd(region.currency) : undefined}
        format={(v) => (v === 0 ? 'No budget yet' : formatRegionCurrency(v, region))}
        hint="The planner uses this to phase the roadmap — Phase 1 fits within this amount."
      />
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function profileToDraft(profile: PlannerProfile | null): Draft {
  if (!profile) return initialDraft
  const home = profile.home
  return {
    locationRawQuery: home.locationRawQuery ?? home.locationLabel ?? '',
    resolved:
      home.latitude !== undefined && home.longitude !== undefined
        ? {
            formatted: home.locationLabel ?? '',
            latitude: home.latitude,
            longitude: home.longitude,
            country: home.geocodedCountry,
            countryCode: home.geocodedCountryCode,
            state: home.geocodedState,
            city: home.geocodedCity,
            postcode: home.geocodedPostcode,
          }
        : null,
    climateZone: home.climateZone,
    floorAreaSqm: home.floorAreaSqm,
    householdSize: home.householdSize ?? 3,
    roofAreaSqm: home.roofAreaSqm,
    roofType: home.roofType,
    roofOrientation: home.roofOrientation,
    monthlyElectricityKwh: profile.energy.monthlyElectricityKwh,
    monthlyBillAmount: profile.energy.monthlyBillAmount,
    monthlyWaterM3: profile.water.monthlyWaterM3,
    hasGarden: profile.water.hasGarden ?? false,
    coolingUsageLevel: home.coolingUsageLevel,
    existingMeasures: home.existingMeasures ?? [],
    sustainabilityBudget: home.sustainabilityBudget,
  }
}

// Re-exported for consumers that need a one-off search (homes manager).
export { searchLocation }
export type { GeocodedLocation }
