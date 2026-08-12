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
 *
 * ## The one deliberate omission
 *
 * **`Form` is not re-exported here.** It is reachable only as
 * `@velobits/ui/form`.
 *
 * `react-hook-form` is an optional peer dependency, and this barrel is a single
 * bundled module — so re-exporting `Form` would put a top-level
 * `import 'react-hook-form'` at the top of `dist/index.js`, and every app that
 * imports a Button from the barrel would fail to resolve a package it never
 * installed and has no forms in.
 *
 * `packages/ui/test/registry-parity.test.ts` asserts this exception by name, in
 * both directions: `Form` must be absent from the barrel AND present as a
 * subpath export. Every other buildable item must be here.
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
export { useRowSelection, type RowSelection } from './hooks/use-row-selection';
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
  type CardProps,
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

/* ── Tier 2 — overlays (the Tier-O glass tier) ────────────────────────────── */
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  dialogContentVariants,
  type DialogContentProps,
} from './ui/dialog';
export {
  SidePanel,
  SidePanelClose,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
  sidePanelContentVariants,
  type SidePanelContentProps,
} from './ui/side-panel';
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover';
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuSubTriggerProps,
} from './ui/dropdown-menu';
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toastVariants,
  type ToastProps,
} from './ui/toast';
export {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPalette,
  CommandSeparator,
  CommandShortcut,
  type CommandDialogProps,
} from './ui/command-palette';

/* ── Tier 3 — composites ──────────────────────────────────────────────────── */
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionTriggerProps,
} from './ui/accordion';
export {
  AppShell,
  AppShellHeader,
  AppShellSidebarTrigger,
  useAppShell,
  type AppShellHeaderProps,
  type AppShellProps,
} from './ui/app-shell';
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type BreadcrumbLinkProps,
} from './ui/breadcrumb';
export { CodeBlock, codeBlockVariants, type CodeBlockProps } from './ui/code-block';
export {
  DataTable,
  nextSort,
  type DataTableColumn,
  type DataTableProps,
  type SortState,
} from './ui/data-table';
export {
  DiffViewer,
  diffLines,
  type DiffKind,
  type DiffLine,
  type DiffViewerProps,
} from './ui/diff-viewer';
export { EmptyState, emptyStateVariants, type EmptyStateProps } from './ui/empty-state';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
  type PaginationLinkProps,
  type PaginationRangeOptions,
  type PaginationStepProps,
} from './ui/pagination';
export {
  SegmentedControl,
  type SegmentOption,
  type SegmentedControlProps,
} from './ui/segmented-control';
export { STATUS_ORDER, StatusChip, type Status, type StatusChipProps } from './ui/status-chip';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type TableProps,
} from './ui/table';
export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants } from './ui/tabs';
