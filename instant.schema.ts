// payment823
// https://instantdb.com/dash?s=main&t=home&app=a5f92eab-3b4c-4ad2-86cb-18fabdda61f4

import { i } from "@instantdb/core";

const graph = i.graph(
  {
    "$files": i.entity({
      "path": i.any().unique().indexed(),
      "url": i.any(),
    }),
    "$streams": i.entity({
      "abortReason": i.any(),
      "clientId": i.any().unique().indexed(),
      "done": i.any(),
      "size": i.any(),
    }),
    "$users": i.entity({
      "email": i.any().unique().indexed(),
      "imageURL": i.any(),
      "type": i.any(),
    }),
    "payments": i.entity({
      "createdAt": i.any(),
      "createdBy": i.any(),
      "deletedAt": i.any(),
      "description": i.any(),
      "money": i.any(),
      "name": i.any().indexed(),
      "updatedAt": i.any(),
      "updatedBy": i.any(),
    }),
  },
  {
    "$streams$files": {
      "forward": {
        "on": "$streams",
        "has": "many",
        "label": "$files"
      },
      "reverse": {
        "on": "$files",
        "has": "one",
        "label": "$stream"
      }
    },
    "$usersLinkedPrimaryUser": {
      "forward": {
        "on": "$users",
        "has": "one",
        "label": "linkedPrimaryUser"
      },
      "reverse": {
        "on": "$users",
        "has": "many",
        "label": "linkedGuestUsers"
      }
    }
  }
);

export default graph;
