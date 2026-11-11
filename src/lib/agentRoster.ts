/**
 * The Agents list's rows in the order it draws them: the pinned card first, in pin order, then
 * every PC's agents in the roster's order, or in that PC's own Activity order when Settings asks
 * for it (lib/sidebarOrder.ts). A row is its PC and its pane: two PCs may reuse a pane id.
 */
import type { Machine } from "../../shared/machines.ts";
import { sidebarAgents, type SidebarAgent } from "./sidebarAgents.ts";
import { activityOrder } from "./sidebarOrder.ts";
import { sidebarPinKey, splitPinnedRows } from "./sidebarPins.ts";

export interface AgentRow { machine: Machine; entry: SidebarAgent }

export interface AgentRosterOptions {
  /** Settings → Agents order: Activity sorts each PC's rows by that PC's own counters */
  byActivity: boolean;
  /** a PC's state-change counters, as lib/sidebarActivity.tsx keeps them */
  seqs(machineId: string): ReadonlyMap<string, number>;
  /** the pinned rows' keys (lib/sidebarPins.ts), in pin order */
  pinned: readonly string[];
}

/** Every PC's agent rows as the list draws them: the pinned ones first, then the rest in source order. */
export function agentRoster(machines: readonly Machine[], options: AgentRosterOptions): { pinned: AgentRow[]; rest: AgentRow[] } {
  const rows = machines.flatMap((machine) => {
    const agents = sidebarAgents(machine.snapshot);
    return (options.byActivity ? activityOrder(agents, (entry) => entry.pane, options.seqs(machine.id)) : agents).map((entry): AgentRow => ({ machine, entry }));
  });
  return splitPinnedRows(rows, options.pinned, ({ machine, entry }) => sidebarPinKey(machine.id, entry.pane.pane_id));
}

/** One workspace's agents in the Agents list, under a head that names the workspace (and its PC beside another). */
export interface AgentGroup { key: string; machine: Machine; workspace: AgentRow["entry"]["workspace"]; rows: AgentRow[] }

/**
 * The unpinned rows gathered by the workspace they run in, as the Codex app gathers threads under
 * their project: a group stands where its first row stood, so herdr's order or the Activity order
 * still decides which workspace comes first, and each keeps its rows in the same order.
 */
export function agentGroups(rows: readonly AgentRow[]): AgentGroup[] {
  const groups = new Map<string, AgentGroup>();
  for (const row of rows) {
    const key = agentGroupKey(row.machine.id, row.entry.workspace.workspace_id);
    const group = groups.get(key);
    if (group) group.rows.push(row);
    else groups.set(key, { key, machine: row.machine, workspace: row.entry.workspace, rows: [row] });
  }
  return [...groups.values()];
}

/** a group's key: two PCs may reuse a workspace id */
export function agentGroupKey(machineId: string, workspaceId: string): string {
  return `${machineId}\u0000${workspaceId}`;
}
