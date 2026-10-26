/**
 * The app's icon vocabulary, drawn by Tabler Icons (tabler.io/icons, MIT; THIRD_PARTY_NOTICES.md).
 * Components import a glyph by what it means here, never from the icon package, so one line
 * changes a glyph everywhere it stands and the whole set keeps one stroke (.tabler-icon in
 * src/styles.css sizes and weights it).
 *
 * Filled faces are for what a glance reads as a state or an identity: an alert, a done or failed
 * step, a pinned row, a starred repo, a folder, a PC, a clock on a queued message, and the
 * Settings pages' own marks. Actions and toggles (close, copy, search, eye, mic) stay outlined,
 * as a stop glyph (Square) is filled because it is a state's button.
 */
import {
  IconAdjustmentsHorizontal, IconAlertCircleFilled, IconAlertTriangleFilled, IconArrowBackUp, IconArrowDown, IconArrowLeft,
  IconArrowRight, IconArrowUp, IconArrowsLeftRight, IconArrowsMaximize, IconArrowsMinimize, IconBellFilled, IconBellOff, IconBook,
  IconBraces, IconBrain, IconCameraRotate, IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp, IconCircle,
  IconCircleCheckFilled, IconCircleDot, IconCircleOff, IconCircleXFilled, IconClipboard, IconClipboardCheck, IconClockFilled,
  IconCode, IconColumns2, IconCopy, IconCopyOff, IconCornerDownLeft, IconCornerLeftUp, IconCursorText, IconDeviceDesktop,
  IconDeviceDesktopFilled, IconDeviceMobile, IconDeviceMobileFilled, IconDots, IconDownload, IconEraser, IconExternalLink, IconEye,
  IconEyeOff, IconFile, IconFileCertificate, IconFileCode, IconFileCode2, IconFileDiff, IconFileDigit, IconFileLock, IconFileMusic,
  IconFileSettings, IconFileSpreadsheet, IconFileText, IconFileTypography, IconFileZip, IconFold, IconFolderCode, IconFolderFilled,
  IconFolderOpenFilled, IconFolderPlus, IconFolderSearch, IconGauge, IconGaugeFilled, IconGitBranch, IconGitMerge, IconHelpCircle,
  IconHistory, IconHomeFilled, IconInfoCircleFilled, IconJson, IconKeyboard, IconKeyboardFilled, IconLayoutList, IconLayoutRows,
  IconLayoutSidebar, IconLayoutSidebarRight, IconLink, IconListCheck, IconLoader2, IconLock, IconMenu2, IconMessage, IconMessageFilled,
  IconMessagePlus, IconMicrophone, IconMicrophoneFilled, IconMinus, IconNetwork, IconPackage, IconPalette, IconPaletteFilled, IconPencil,
  IconPhoto, IconPhotoOff, IconPinFilled, IconPinnedOff, IconPlug, IconPlugConnectedX, IconPlus, IconPuzzle, IconPuzzleFilled, IconQuote,
  IconRefresh, IconRobot, IconRotateClockwise, IconScan, IconSearch, IconSelector, IconSend, IconSend2, IconSettingsFilled, IconSitemap,
  IconSquareFilled, IconStack2, IconStarFilled, IconSunMoon, IconTarget, IconTerminal, IconTrash, IconUser, IconVideo,
  IconWorld, IconX, IconChartBar, IconTypography, IconKey,
} from "@tabler/icons-react";
import { TerminalSquare as ReiconTerminalSquare } from "reicon-react";
import { createElement, forwardRef, type ComponentProps, type ComponentRef } from "react";
import type { Icon, IconProps } from "@tabler/icons-react";

/**
 * The boxed terminal glyph is Reicon's (reicon.dev, MIT; THIRD_PARTY_NOTICES.md): a prompt in a
 * rounded frame whose filled face reads as a mark beside the other filled page icons, which
 * Tabler's terminal has no filled cut for. Reicon draws an outline as expanded paths, so it keeps
 * its own 1.5 stroke and takes colour and size as the Tabler icons do.
 */
type ReiconWeight = ComponentProps<typeof ReiconTerminalSquare>["weight"];
function reicon(weight: ReiconWeight, name: string): Icon {
  // the Tabler props a caller may pass (stroke, title) have no Reicon meaning: stroke is dropped, the rest go through
  const Glyph = forwardRef<ComponentRef<typeof ReiconTerminalSquare>, IconProps>(({ stroke: _stroke, size, title, ...rest }, ref) =>
    createElement(ReiconTerminalSquare, { ...(rest as object), ref, weight, size, ...(title ? { "aria-label": title } : {}) }));
  Glyph.displayName = name;
  return Glyph as unknown as Icon;
}
export const SquareTerminal = reicon("Outline", "SquareTerminal");
export const SquareTerminalFilled = reicon("Filled", "SquareTerminalFilled");

export type { Icon as IconComponent, IconProps } from "@tabler/icons-react";

export {
  IconAdjustmentsHorizontal as SlidersHorizontal,
  IconChartBar as ChartBar,
  IconTypography as Typography,
  IconKey as Key,
  IconAlertCircleFilled as CircleAlert,
  IconAlertTriangleFilled as TriangleAlert,
  IconArrowBackUp as Undo2,
  IconArrowDown as ArrowDown,
  IconArrowLeft as ArrowLeft,
  IconArrowRight as ArrowRight,
  IconArrowUp as ArrowUp,
  IconArrowsLeftRight as ArrowLeftRight,
  IconArrowsMaximize as Maximize2,
  IconArrowsMinimize as Minimize2,
  IconBellFilled as Bell,
  IconBellOff as BellOff,
  IconBook as BookOpen,
  IconBrain as Brain,
  IconBraces as Braces,
  IconCameraRotate as SwitchCamera,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
  IconChevronUp as ChevronUp,
  IconCircle as Circle,
  IconCircleCheckFilled as CircleCheck,
  IconCircleDot as CircleDot,
  IconCircleOff as CircleSlash,
  IconCircleXFilled as CircleX,
  IconClipboard as ClipboardPaste,
  IconClipboardCheck as ClipboardCheck,
  IconClockFilled as Clock,
  IconCode as Code,
  IconColumns2 as Columns2,
  IconCopy as Copy,
  IconCopyOff as CopySlash,
  IconCornerDownLeft as CornerDownLeft,
  IconCornerLeftUp as CornerLeftUp,
  IconCursorText as TextCursorInput,
  IconDeviceDesktop as Monitor,
  IconDeviceDesktopFilled as MonitorFilled,
  IconDeviceMobile as Smartphone,
  IconDeviceMobileFilled as SmartphoneFilled,
  IconDots as Ellipsis,
  IconDownload as Download,
  IconEraser as Eraser,
  IconExternalLink as ExternalLink,
  IconEye as Eye,
  IconEyeOff as EyeOff,
  IconFile as File,
  IconFileCertificate as FileKey,
  IconFileCode as FileCode,
  IconFileCode2 as FileTerminal,
  IconFileDiff as FileDiff,
  IconFileDigit as FileDigit,
  IconFileLock as FileLock,
  IconFileMusic as FileAudio,
  IconFileSettings as FileCog,
  IconFileSpreadsheet as FileSpreadsheet,
  IconFileText as FileText,
  IconFileTypography as FileType,
  IconFileZip as FileArchive,
  IconFold as ChevronsDownUp,
  IconFold as FoldVertical,
  IconFolderCode as FolderGit,
  IconFolderCode as FolderGit2,
  IconFolderFilled as Folder,
  IconFolderOpenFilled as FolderOpen,
  IconFolderPlus as FolderPlus,
  IconFolderSearch as FolderSearch,
  IconGauge as Gauge,
  IconGaugeFilled as GaugeFilled,
  IconGitBranch as GitBranch,
  IconGitMerge as GitMerge,
  IconHelpCircle as CircleQuestionMark,
  IconHistory as History,
  IconHomeFilled as House,
  IconInfoCircleFilled as Info,
  IconJson as FileJson,
  IconKeyboard as Keyboard,
  IconKeyboardFilled as KeyboardFilled,
  IconLayoutList as Rows3,
  IconLayoutRows as Rows2,
  IconLayoutSidebar as PanelLeft,
  IconLayoutSidebarRight as PanelRight,
  IconLink as Link,
  IconLink as Link2,
  IconListCheck as ListChecks,
  IconLoader2 as LoaderCircle,
  IconLock as LockKeyhole,
  IconMenu2 as Menu,
  IconMessage as MessageSquare,
  IconMessageFilled as MessageSquareFilled,
  IconMessagePlus as MessageSquarePlus,
  IconMicrophone as Mic,
  IconMicrophoneFilled as MicFilled,
  IconMinus as Minus,
  IconNetwork as Network,
  IconPackage as Package,
  IconPalette as Palette,
  IconPaletteFilled as PaletteFilled,
  IconPencil as Pencil,
  IconPhoto as FileImage,
  IconPhotoOff as ImageOff,
  IconPinFilled as Pin,
  IconPinnedOff as PinOff,
  IconPlug as Plug,
  IconPlugConnectedX as Unplug,
  IconPlus as Plus,
  IconPuzzle as Puzzle,
  IconPuzzleFilled as PuzzleFilled,
  IconQuote as Quote,
  IconRefresh as RefreshCw,
  IconRobot as Bot,
  IconRotateClockwise as RotateCw,
  IconScan as Scan,
  IconSearch as Search,
  IconSelector as ChevronsUpDown,
  IconSend as Send,
  IconSend2 as SendHorizontal,
  IconSettingsFilled as Settings,
  IconSitemap as Workflow,
  IconSquareFilled as Square,
  IconStack2 as Layers,
  IconStarFilled as Star,
  IconSunMoon as SunMoon,
  IconTarget as Target,
  IconTerminal as Terminal,
  IconTrash as Trash2,
  IconUser as UserRound,
  IconVideo as FileVideo,
  IconWorld as Globe,
  IconX as X,
};
