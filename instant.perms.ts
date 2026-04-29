// payment823
// https://instantdb.com/dash?s=main&t=home&app=a5f92eab-3b4c-4ad2-86cb-18fabdda61f4

// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/core";

const rules = {
  "$users": {
    "allow": {
      "view": "true",
      "create": "true",
      "delete": "false",
      "update": "true"
    }
  },
  "payments": {
    "allow": {
      "view": "true",
      "create": "true",
      "delete": "true",
      "update": "true"
    }
  }
} satisfies InstantRules;

export default rules;
