// Pure drag-and-drop land assignment tests: npm run test:order
import { applyDrop, moveByOffset } from "../src/lib/order-state";

let failures = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}\n      expected ${e}\n      actual   ${a}`);
  }
}

const certs = [
  { id: 10, category: "certification", title: "AWS CCP" },
  { id: 1, category: "certification", title: "MTCNA" },
  { id: 2, category: "certification", title: "BNSP" },
  { id: 11, category: "training", title: "AWS re/Start" },
  { id: 5, category: "training", title: "Proxmox" },
];

console.log("single list (Experience)");
const single = [
  { id: 1, company: "A" },
  { id: 2, company: "B" },
  { id: 3, company: "C" },
  { id: 4, company: "D" },
];
check("drag A onto C -> B,C,A,D", applyDrop(single, { activeId: 1, overId: "3", groupByCategory: false }).items.map((r) => r.id), [2, 3, 1, 4]);
check("drag D onto B -> A,D,B,C", applyDrop(single, { activeId: 4, overId: "2", groupByCategory: false }).items.map((r) => r.id), [1, 4, 2, 3]);
check("drop onto itself -> unchanged", applyDrop(single, { activeId: 2, overId: "2", groupByCategory: false }).changed, false);
check("drop on a group id in a single list -> unchanged", applyDrop(single, { activeId: 2, overId: "group:training", groupByCategory: false }).changed, false);
check("move down button on B -> A,C,B,D", moveByOffset(single, 2, 1, false).items.map((r) => r.id), [1, 3, 2, 4]);
check("move up button on B -> B,A,C,D", moveByOffset(single, 2, -1, false).items.map((r) => r.id), [2, 1, 3, 4]);
check("move up at the top -> unchanged", moveByOffset(single, 1, -1, false).changed, false);
check("move down at the bottom -> unchanged", moveByOffset(single, 4, 1, false).changed, false);

console.log("certifications (two groups)");
check(
  "same group: drag AWS onto BNSP -> MTCNA,BNSP,AWS",
  applyDrop(certs, { activeId: 10, overId: "2", groupByCategory: true }).items.map((r) => r.id),
  [1, 2, 10, 11, 5]
);
check(
  "cross group: drag AWS onto AWS re/Start -> training first",
  applyDrop(certs, { activeId: 10, overId: "11", groupByCategory: true }).items.map((r) => r.id),
  [1, 2, 10, 11, 5]
);
const crossed = applyDrop(certs, { activeId: 10, overId: "11", groupByCategory: true }).items;
check("crossed row changed category", crossed.find((r) => r.id === 10)?.category, "training");
check("source group keeps its order", crossed.filter((r) => r.category === "certification").map((r) => r.id), [1, 2]);
check("destination keeps the hovered neighbour after it", crossed.filter((r) => r.category === "training").map((r) => r.id), [10, 11, 5]);
check(
  "blank category counts as a certification then can move to training",
  applyDrop([{ id: 7, category: "" }, { id: 8, category: "training" }], { activeId: 7, overId: "8", groupByCategory: true }).items.map(
    (r) => `${r.id}:${r.category}`
  ),
  ["7:training", "8:training"]
);
check(
  "drop into the empty group container lands first",
  applyDrop([{ id: 1, category: "certification" }], { activeId: 1, overId: "group:training", groupByCategory: true }).items.map(
    (r) => `${r.id}:${r.category}`
  ),
  ["1:training"]
);
check(
  "drop on the group container where it already is -> unchanged",
  applyDrop(certs, { activeId: 10, overId: "group:certification", groupByCategory: true }).changed,
  false
);
check(
  "move down button walks inside its own group only",
  moveByOffset(certs, 1, 1, true).items.map((r) => r.id),
  [10, 2, 1, 11, 5]
);

console.log(failures ? `\n${failures} failure(s)` : "\nall order-state checks passed");
process.exit(failures ? 1 : 0);
