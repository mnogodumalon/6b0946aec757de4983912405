/**
 * votes — the plan's VOTING pages as data (EF-61), generated from plan + structure.
 *
 * A page whose visitors answer each of a list of OPTIONS with one small choice (a poll's
 * dates with Ja / Vielleicht / Nein, a menu's dishes, a roster's shifts) is not hand-built:
 * the block `OptionVote` (`@/components/blocks/OptionVote`) renders the input (a list of
 * cards on a phone, the matrix with an input row on a wide screen), the read-only matrix of
 * everybody, the state after sending and the returning visitor — wired with this spec:
 *
 *   <OptionVote port={port} vote={VOTES['<slug>']} parentId={linkedId} draftKey="<slug>" />
 */
export interface VoteSpec {
  /** the options people answer (a poll's date proposals) */
  option: { entity: string; parentRef: string | null; start: string | null; end: string | null };
  /** the answers: one record per option and send */
  answer: {
    entity: string;
    /** → the option */
    optionRef: string;
    /** → the page's link record (a door per record presets it) */
    parentRef: string | null;
    /** the small choice field */
    choice: string;
    /** the typed fields that name the person (the row's label) */
    names: string[];
    /** every typed field of the send (names first) */
    fields: string[];
    /** the page's own device/row key field, when the plan has one */
    deviceField: string | null;
    /** the submission's secret key field (EF-50), when the plan has one */
    keyField: string | null;
  };
  /** the choice keys that mean yes / maybe — the winner rule (topOne) and the counts */
  yes: string;
  maybe: string | null;
  /** the link record: its status closes the vote, its reference to an option is the result */
  parent: { entity: string; statusField: string | null; closedValues: string[]; finalField: string | null } | null;
}

/** slug → the page's voting pattern. Empty when the plan has no such page. */
export const VOTES: Record<string, VoteSpec> = {};
