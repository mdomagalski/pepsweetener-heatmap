# glycopeptide-heatmap

> Element generating the heatmap, this accepts json with the following structure:
> {mass: Number (query mass), data: {'peptides':[String,...], 'glycans': [String,...], 
> 'map': {'peptide': Index, 'glycan': Index, 'value': Number (difference from the query mass),
> mass: Number}}}
> The element is called from the multi-result wrapper, which collects all the results from 
> search form and navigates the chart data update.

## Usage

1. Import polyfill:

    ```html
    <script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
    ```

2. Import custom element:

    ```html
    <link rel="import" href="bower_components/glycopeptide-heatmap/glycopeptide-heatmap.html">
    ```

3. Start using it!

    ```html
    <glycopeptide-heatmap></glycopeptide-heatmap>
    ```

## Options

Attribute     | Options     | Default      | Description
---           | ---         | ---          | ---
`data`        | *array*     |  null        | input data for the chart
`gridSize`    | *number*    | `14`         | pixel size of the single chart tile
`margin`      | *array*     | { top: 200,  | svg margins
              |             | right: 100,  |
              |             | bottom: 50,  |
              |             | left: 200}   | 
 `sorting`    | *string*    | null         | string containing name of currently 
              |             |              | applied sorting function               

## Methods

Method                    | Parameters   | Returns     | Description
---                       | ---          | ---         | ---
`attached()`              | None.        | Nothing.    | generates chart
`_dataChanged()`          | None.        | Nothing.    | listener, reloads the chart when this.data is changed
`_sortObserver()`         | None.        | Nothing.    | listener monitoring 'sorting' dropdown menu 
`formatChartDescription()`| None.        | Nothing.    | Updates chart description after data change
`createRowLabels()`       | None.        | Nothing.    | Generate labels
`createColumnLabels()`    | None.        | Nothing.    | Generate labels
`createCardsAndBar()`     | None.        | Nothing.    | Generate chart tiles and score bar
`sortBySequenceAndComposition()`| None.  | Nothing.    | Sorting function


## Development

In order to run it locally you'll need to fetch some dependencies and a basic server setup.

1. Install [bower](http://bower.io/) & [polyserve](https://npmjs.com/polyserve):

    ```sh
    $ npm install -g bower polyserve
    ```

2. Install local dependencies:

    ```sh
    $ bower install
    ```

3. Start development server and open `http://localhost:8080/components/glycopeptide-heatmap/`.

    ```sh
    $ polyserve
    ```

## History

For detailed changelog, check [Releases](https://bitbucket.org/sib-pig/glycopeptide-heatmap/releases).

## License

[MIT License](http://opensource.org/licenses/MIT)
