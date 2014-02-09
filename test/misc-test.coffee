jqconsole = type = keyDown = null

describe 'Misc methods', ->
  beforeEach ->
    {jqconsole, typer: {keyDown, type}} = jqconsoleSetup()
    jqconsole.Prompt true, ->
  afterEach ->
    jqconsole.AbortPrompt()

  describe '#GetColumn', ->
    it 'should get the column number of the cursor', ->
      label_length = 'headerprompt_label'.length
      assert.equal jqconsole.GetColumn(), label_length
      type '   '
      assert.equal jqconsole.GetColumn(), label_length + 3

  describe '#GetLine', ->
    it 'should get the line number of the cursor', ->
      assert.equal jqconsole.GetLine(), 0
      keyDown 13, shiftKey: on
      assert.equal jqconsole.GetLine(), 1
      keyDown 13, shiftKey: on
      assert.equal jqconsole.GetLine(), 2