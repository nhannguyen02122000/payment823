Description: I want to make an application to gather information, saving to InstantDB and report information from user's query on payment and summarize payment. User may log in via clerk
Guide me step by step, ask me any unclear question, any set up needed or environment needed should be ask via TUI.

## 1. Techstack:
- FE: NextJS + TypeScript
- BE: NextJS + Typescript (Same project)
- UI: /ui-ux-pro-max skills + Tailwind CSS
- Auth: Clerk

## 2. Authentication
- We are using Clerk for authentication. It will connect with InstantDB
- Allow user to use Google to sign in (Can skip sign up) via Clerk (guide be step by step to enable this). Do not allow other sign in or sign up methods.
- When sign up by Google, sync the information to $users entity in InstantDB

## 3. Database
- $users:
    - This entity is pre-defined in instantDB. 
    - We need to store information response by Clerk when user first sign up
    - Must have column is clerk_id, username, avatar_url, created_at
    - Can think of other column
- payments: i.entity({
      // The person who paid, link to username in $users
      name: i.string().indexed(),
      // Stored as x, displayed as x * 1000 VND
      money: i.number(),
      // Optional description/explanation
      description: i.string().optional(),
      // Telegram username who created this record, link to username in $users
      created_by: i.string(),
      // Telegram username who last updated this record, link to username in $users
      updated_by: i.string(),
      // Unix timestamp in ms when record was created
      created_at: i.number().indexed(),
      // Unix timestamp in ms when record was last updated
      updated_at: i.number(),
      // null = active, timestamp = soft-deleted
      deleted_at: i.number().optional(),
    }),
- All queries must be in Back-end, use INSTANTDB_ADMIN_TOKEN env variable
- We integrated Clerk to InstantDB, use NEXT_PUBLIC_CLERK_CLIENT_NAME as clerk client name for instantDB
- At the root folder, with instant.schema.ts and instant.perms.ts file

## 4. Features

All of the features only be accessible after log in.
Build UI + API for every feature
This application will be on both mobile + desktop view. Make UI responsive

### 4.1 Add payment
User can add payment. These following information will be collected:
- name (will be chosen from dropdown of a list with in $users in the Database)
- money will be in the format x, save to DB x, but display to user in x*1000 (with thousand separator and VND suffix) a number input
- description can be null, save to DB for description only
- When adding new payment, other fields will be saved as well, a unique uuid, created_at and updated_at which are the same and are the current timestamp at the time of calling API. created_by and updated_by will be current user's username in $users entity, deleted_at will be saved default as null.

### 4.2 Edit Payment
User can edit an existing payment record. This will updated fields of that record in the Database.
- name (will be chosen from dropdown of a list with in $users in the Database)
- money will be in the format x, save to DB x, but display to user in x*1000 (with thousand separator and VND suffix) a number input
- description can be null, save to DB for description only
- uuid cannot be updated, it will be used to lookup for the record
- updated_at will be updated to current timestamp at the time of calling API
- updated_by will be updated to current user's username in $users entity, who make the API call
- Other fields remain unchanged

### 4.3 Delete Payment
User can delete an existing payment record. This will updated fields of that record in the Database
- deleted_at field to the current timestamp
- updated_at will be updated to current timestamp at the time of calling API
- updated_by will be updated to current user's username in $users entity, who make the API call
- Other fields remain unchanged

### 4.4 Listing Payment
User can view the listing of payment records, supporting infinite loading, pagination, sorting and filtering

For listing, each record will display:
- value: name, label: PIC
- value: money, label: Amount of money, note: money will be in the format x, save to DB x, but display to user in x*1000 (with thousand separator and VND suffix) a number input
- value: description, label: Description (long text)
- value: created_at, label: Create At
- value: created_by, label: Create By
- value: updated_at, label: Updated At
- value: updated_by, label: Updated By
Listing, Sorting and Filtering will always exclude record where deleted_at is not Null (has been soft deleted)

Filtering will be on the fields:
- name (dropdown selection)
- Range of money
- Date and time of created and updated

Soring will be on the fields:
- name
- Range of money
- Date and time of created and updated

By default:
- pagination will response with 1st page, 20 records/page
- sorting by updated_at (latest first)
- filtered within the month of query (get the current timestamp --> get current month and year --> filter records that has timestamp within the month)

### 4.5 Summarize
User can create a summary report by monthly period within a year, user can select [month] and [year]
- This will first filter all of the record within [month] of [year] whose deleted_at field is null (not deleted)
- Then, it will group by who pay how much (key is [name] and value is the total money of [name]). Message response to user must be [money] * 1000 with thousand separator and VND suffix and save as an object ${MONEY_SPENT_PER_PERSON}
- Then, it will calculate ${TOTAL_MONEY_SPENT} in month
- Calculate the total number of names, then calculate how much each name should spent by ${TOTAL_MONEY_SPENT}/${THE_NUMBER_OF_NAMES}
- Find a user with name ${ENV_USER_TO_SUMARIZE}, then summary, [name] should transfer back to ${ENV_USER_TO_SUMARIZE} or ${ENV_USER_TO_SUMARIZE} should transfer back to [name], and how much of that
- [name] is username in $users Entity
- Display up to 2 decimal places