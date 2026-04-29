I want to make an application (no interface or UI needed), that connect to my Telegram bot to gather information, saving to InstantDB and report information from user's query.

User may type into the bot: /pay, /edit, /delete or /summarize command
/pay [name]-[money]-[explaination]:
- name will be Nhan, Thuong or Dung only. If input other name, response with error message
- money will be in the format x, save to DB x, but display to user in x*1000 (with thousand separator and VND suffix)
- explaination can be null, save to DB for description only
- Variables must be splitted by '-'
- Add a help for user
- This command will then save 3 information to the database, together with a unique uuid, created_at and updated_at which are the same and are the current timestamp. Then, response to the Telegram with the message of success/failed, with the uuid. We also need to get the user's name on Telegram to save it together with those information as well in the created_by and updated_by (uuid, created_at, updated_at, name, money, explaination, created_by, updated_by and deleted_at field). deleted_at default to be null

/edit [uuid]-[name]-[money]-[explaination]:
- Same with /pay, but will be use to edit.
- It will lookup uuid record in the database, then modify name, money and explaination. It will also modify the updated_at and updated_by field

/delete [uuid]
- Delete uuid record (soft delete)
- Update deleted_at field to the current timestamp, update updated_at and updated_by field

/summarize [year]-[month]
- This command will first filter all of the record within [month] of [year] whose deleted_at field is null (not deleted)
- Then, it will group by who pay how much (key is [name] and value is the total money of [name]). Message response to user must be [money] * 1000 with thousand separator and VND suffix and save as an object ${MONEY_SPENT_PER_PERSON}
- Then, it will calculate ${TOTAL_MONEY_SPENT} in month
- Calculate the total number of names, then calculate how much each name should spent by ${TOTAL_MONEY_SPENT}/${THE_NUMBER_OF_NAMES}
- Find a user with name 'Nhan', then summary, [name] should transfer back to Nhan or Nhan should transfer back to [name], and how much of that
- Response to Telegram message with this format
"""
Total money spent in [year]-[month]: ${TOTAL_MONEY_SPENT}
Each person should spent: ${TOTAL_MONEY_SPENT}/${THE_NUMBER_OF_NAMES}
Current spending by each: ${MONEY_SPENT_PER_PERSON}
Transfering to Nhan: ${OBJECT_PERSON_AND_AMOUNT_OF_MONEY}
Nhan need to transfer: ${OBJECT_PERSON_AND_AMOUNT_OF_MONEY}
"""

Think of a design for instantDB database to save these information


