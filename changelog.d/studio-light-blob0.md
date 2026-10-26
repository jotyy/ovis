### Changed

- The Studio light theme is now Blob0's light system: white content on a neutral grey chrome, hairline neutral edges, blue for the accent and the primary action, and layered soft shadows in place of the dark line and inner light. Field buttons take a faint fall of grey down their face.

### Fixed

- The quick replies, the composer's attachment tiles and a phone's recent-folder chips kept their rings and shadows whole: the rows that scroll them sideways no longer clip their top and bottom edges.
- Inline code and tables in an answer draw one ring, not a ring doubled by an inner light.

### Changed

- The chat is drawn after AI Elements (shadcn's chat components): the user's words in a neutral bubble on the secondary surface, the agent's work as a bordered tool card whose head and rows carry a glyph, a medium title and the chevron at the row's end, thinking as a brain row, a call's input and output as blocks on the muted surface, code blocks as bordered cards with their language and copy strip always drawn, quick replies as pills, and the message box as a card with ghost tools and one square accent submit button.
- The sidebar is redrawn after Blob0's app sidebar: 32px rows with one mark each (the pane's agent, the project's icon, or the shell glyph), a workspace's branch dim after its name on the same line, the PC's name as a section label, the chosen row on the primary face with its words and state in the primary text colour and no bar at the edge, section labels on the rows' inset, and the footer parted by a divider.
- The chat's work and code cards draw a real border, so nothing beside them can cover the edge a shadow ring used to draw.
- The agent's work is a quiet log, not a card: one line says how long and how much, the calls hang off a hairline rail as a glyph and a line of mono, nothing is boxed or ruled between rows, and a row's chevron shows only under the pointer or once it is open.
- The tab strip is an editor's tab bar: a band of the field's floor over the canvas, quiet names, and the open tab cut from the canvas itself with a hairline round its top and sides. The canvas card draws a hairline instead of a shadow ring.
- The sidebar's chosen row is a nav row's fill, not a button's face. The light along the top of every control in Studio light is fainter.
