/**
 * The barrel `@velobits/ui` publishes.
 *
 * This file exists for the npm half of the dual distribution only. Consumers
 * using the shadcn CLI never see it — they get individual component files copied
 * into their own tree, which is why every component below imports from a
 * relative path rather than from this barrel.
 *
 * Per-component entry points are generated from `registry.json` at build time,
 * so `import { Button } from '@velobits/ui/button'` also works and is what
 * `size-limit` measures.
 */

/* ── Tier 0 — foundation ──────────────────────────────────────────────────── */
export { cn } from './lib/cn';
export {
  THEME_STORAGE_KEYS,
  applyTheme,
  prefersDark,
  readStoredMode,
  resolveTheme,
  themeInitScript,
  watchSystemTheme,
  writeStoredMode,
  type ResolvedTheme,
  type ThemeMode,
} from './lib/theme';
export {
  ThemeProvider,
  useTheme,
  type ThemeContextValue,
  type ThemeProviderProps,
} from './hooks/use-theme';
export { useMediaQuery, usePrefersReducedMotion } from './hooks/use-media-query';
export { VelobitsProvider, type VelobitsProviderProps } from './providers/velobits-provider';

/* ── Tier 1 — primitives ──────────────────────────────────────────────────── */
export { Alert, AlertDescription, AlertTitle, alertVariants, type AlertProps } from './ui/alert';
export { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
export { Badge, badgeVariants, type BadgeProps } from './ui/badge';
export { Button, buttonVariants, type ButtonProps } from './ui/button';
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
export { Checkbox } from './ui/checkbox';
export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  type FieldControlProps,
  type FieldProps,
} from './ui/field';
export { Input } from './ui/input';
export { Kbd } from './ui/kbd';
export { Label } from './ui/label';
export { NativeSelect } from './ui/native-select';
export { Separator } from './ui/separator';
export { Skeleton } from './ui/skeleton';
export { Spinner, type SpinnerProps } from './ui/spinner';
export { Switch } from './ui/switch';
export { Textarea } from './ui/textarea';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

/* ── The glass tier's shared surface (Tier 2 components land on top of it) ─── */
export { GlassSurface, type GlassSurfaceProps } from './ui/glass-surface';
