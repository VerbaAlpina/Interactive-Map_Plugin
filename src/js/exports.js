/**
 * @fileoverview
 * 
 * @suppress{checkTypes}
 */

//Core stuff
window["initMap"] = initMap;
window["categoryManager"] = categoryManager;
categoryManager["registerCategory"] = categoryManager.registerCategory;
categoryManager["addAjaxData"] = categoryManager.addAjaxData;
categoryManager["addElementName"] = categoryManager.addElementName;
categoryManager["addInfoWindowContentConstructor"] = categoryManager.addInfoWindowContentConstructor;
categoryManager["produceMapURL"] = categoryManager.produceMapURL;
window["CategoryInformation"] = CategoryInformation;

//Filter components
window["GroupingComponent"] = GroupingComponent;
window["Sorter"] = Sorter;
window["FlexSearchComponent"] = FlexSearchComponent;

//Sorters
window["AlphabetSorter"] = AlphabetSorter;
window["RecordNumberSorter"] = RecordNumberSorter;

//List builders
window["SimpleListBuilder"] = SimpleListBuilder;
SimpleListBuilder.prototype["addListPrinter"] = SimpleListBuilder.prototype.addListPrinter;

//List printers
window["CsvListPrinter"] = CsvListPrinter;
window["ExcelCsvListPrinter"] = ExcelCsvListPrinter;
window["HtmlListPrinter"] = HtmlListPrinter;
window["JsonListPrinter"] = JsonListPrinter;
