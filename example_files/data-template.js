/**@enum {number}*/
var categories = {
    Geographic_Data : 0,
    Countries: 1,
    Anfangsbuchstabe : 2,
    Informant : 3,
    Tree_Parts : 4
};

var /**AlphabetSorter */ alphabetSorter = new AlphabetSorter();
var /**RecordNumberSorter */ numRecSorter = new RecordNumberSorter();
var sorter = new Sorter([alphabetSorter, numRecSorter]);
var grouping = new GroupingComponent([categories.Countries, categories.Anfangsbuchstabe], categories.Countries, sorter)

categoryManager.registerCategory (
    new CategoryInformation (
        categories.Geographic_Data, 
        'G',
        'Geo-Daten',
        '', 
        'geodaten', 
        [grouping],
        ["Eintrag", "Einträge"], 
        "Kommentar schreiben"
    )
);
categoryManager.registerCategory (new CategoryInformation (categories.Countries, 'L', 'Länder', '(kein Land zugeordnet)', undefined, undefined, ["Eintrag", "Einträge"], "Kommentar schreiben"));

categoryManager.registerCategory (new CategoryInformation (categories.Anfangsbuchstabe, 'A', 'Anfangsbuchstabe', '(numerisch)', undefined, undefined, ["Eintrag", "Einträge"], "Kommentar schreiben"));

categoryManager.registerCategory (
    new CategoryInformation (
        categories.Informant, 
        'I',
        'Informanten',
        '',
        'informanten',
        [grouping],
        undefined,
        "Neuer Kommentar"
    )
);

categoryManager.registerCategory (
    new CategoryInformation (
        categories.Tree_Parts,
        'T',
        'Baum',
        '', 
        'tree-test', 
        undefined,
        ["Eintrag", "Einträge"], 
        "Kommentar schreiben"
    )
);