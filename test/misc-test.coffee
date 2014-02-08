{jqconsole, createScroll, typer: {typeA, keyDown, type}} = jqconsoleSetup()

describe 'Misc methods', ->
  beforeEach ->
    jqconsole.Prompt true, ->

  describe '#GetColumn', ->
    it 'should get the column number of the cursor', ->
      assert.equal jqconsole.GetColumn(), 0
      type '   '
      assert.equal jqconsole.GetColumn(), 3

  describe '#GetLine', ->
    it 'should get the line number of the cursor', ->
      assert.equal jqconsole.GetLine(), 0
      keyDown 13, shiftKey: on
      assert.equal jqconsole.GetLine(), 1
      keyDown 13, shiftKey: on
      assert.equal jqconsole.GetLine(), 2