var _ = require("underscore");
var Cell = require("../lib/cell");
var Enums = require("../lib/enums");

function createRowMock() {
    return {
        cells: {},
        getCell: function(address) {
            return this.cells[address];
        }
    };
}

describe("Cell", function() {
    it("stores values", function() {
        var row = createRowMock();        
        
        row.cells.A1 = new Cell(row, "A1");
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Null);
        
        expect(row.cells.A1.value = 5).toEqual(5);
        expect(row.cells.A1.value).toEqual(5);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Number);
        
        var strValue = "Hello, World!";
        expect(row.cells.A1.value = strValue).toEqual(strValue);
        expect(row.cells.A1.value).toEqual(strValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.String);
        
        var dateValue = new Date();
        expect(row.cells.A1.value = dateValue).toEqual(dateValue);
        expect(row.cells.A1.value).toEqual(dateValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Date);
        
        var formulaValue = {formula: "A2", result: 5};
        expect(row.cells.A1.value = formulaValue).toEqual(formulaValue);
        expect(row.cells.A1.value).toEqual(formulaValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Formula);
        
        // no result
        formulaValue = {formula: "A3"};
        expect(row.cells.A1.value = formulaValue).toEqual(formulaValue);
        expect(row.cells.A1.value).toEqual(formulaValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Formula);
        
        var hyperlinkValue = {hyperlink: "http://www.link.com", text: "www.link.com"};
        expect(row.cells.A1.value = hyperlinkValue).toEqual(hyperlinkValue);
        expect(row.cells.A1.value).toEqual(hyperlinkValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Hyperlink);
        
        expect(row.cells.A1.value = null).toEqual(null);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Null);
    });
    it("validates options on construction", function() {
        var row = createRowMock();
        expect(function() { new Cell(); }).toThrow();
        expect(function() { new Cell(row); }).toThrow();
        expect(function() { new Cell(row, "A"); }).toThrow();
        expect(function() { new Cell(row, "Hello, World!"); }).toThrow();
        expect(function() { new Cell(null, "A1"); }).toThrow();
    });
    it("merges", function() {
        var row = createRowMock();        
        
        row.cells.A1 = new Cell(row, "A1");
        row.cells.A2 = new Cell(row, "A2");
        
        row.cells.A1.value = 5;
        row.cells.A2.value = "Hello, World!";
        
        row.cells.A2.merge(row.cells.A1);
        
        expect(row.cells.A2.value).toEqual(5);
        expect(row.cells.A2.type).toEqual(Enums.ValueType.Merge);
        expect(row.cells.A1._mergeCount).toEqual(1);
        expect(row.cells.A1.isMerged).toBeTruthy();
        expect(row.cells.A2.isMerged).toBeTruthy();
        expect(row.cells.A2.isMergedTo(row.cells.A1)).toBeTruthy();
        expect(row.cells.A2.master).toBe(row.cells.A1);
        expect(row.cells.A1.master).toBe(row.cells.A1);
        
        // assignment of slaves write to the master
        row.cells.A2.value = 7;
        expect(row.cells.A1.value).toEqual(7);
        
        // assignment of strings should add 1 ref
        var strValue = "Boo!";
        row.cells.A2.value = strValue;
        expect(row.cells.A1.value).toEqual(strValue);
        
        // unmerge should work also
        row.cells.A2.unmerge();
        expect(row.cells.A2.type).toEqual(Enums.ValueType.Null);
        expect(row.cells.A1._mergeCount).toEqual(0);
        expect(row.cells.A1.isMerged).toBeFalsy();
        expect(row.cells.A2.isMerged).toBeFalsy();
        expect(row.cells.A2.isMergedTo(row.cells.A1)).toBeFalsy();
        expect(row.cells.A2.master).toBe(row.cells.A2);
        expect(row.cells.A1.master).toBe(row.cells.A1);
    });
    
    it("upgrades from string to hyperlink", function() {
        var row = createRowMock();
        
        var strValue = "www.link.com";
        var linkValue = "http://www.link.com";
        
        row.cells.A1 = new Cell(row, "A1");
        row.cells.A1.value = strValue;
        
        row.cells.A1._upgradeToHyperlink(linkValue);
        
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Hyperlink);
    });
    
    it("doesn't upgrade from non-string to hyperlink", function() {
        var row = createRowMock();        
        
        var linkValue = "http://www.link.com";

        row.cells.A1 = new Cell(row, "A1");
        
        // null
        row.cells.A1._upgradeToHyperlink(linkValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Null);
        
        // number
        row.cells.A1.value = 5;
        row.cells.A1._upgradeToHyperlink(linkValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Number);
        
        // date
        row.cells.A1.value = new Date();
        row.cells.A1._upgradeToHyperlink(linkValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Date);
        
        // formula
        row.cells.A1.value = {formula: "A2"};
        row.cells.A1._upgradeToHyperlink(linkValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Formula);
        
        // hyperlink
        row.cells.A1.value = {hyperlink: "http://www.link2.com", text: "www.link2.com"};
        row.cells.A1._upgradeToHyperlink(linkValue);
        expect(row.cells.A1.type).toEqual(Enums.ValueType.Hyperlink);
        
        // cleanup
        row.cells.A1.value = null;
    });
});