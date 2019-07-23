import {ColorUtil} from "../../../util/color.util";

export class SemanticCategory {

    /**
     * List of SemanticCategories.
     */
    public static LIST = [
        new SemanticCategory('Airplane'),
        new SemanticCategory('Animal'),
        new SemanticCategory('Apparel'),
        new SemanticCategory('Armchair'),
        new SemanticCategory('Ashcan'),
        new SemanticCategory('Awning'),
        new SemanticCategory('Bag'),
        new SemanticCategory('Ball'),
        new SemanticCategory('Bannister'),
        new SemanticCategory('Bar'),
        new SemanticCategory('Barrel'),
        new SemanticCategory('Base'),
        new SemanticCategory('Basket'),
        new SemanticCategory('Bathtub'),
        new SemanticCategory('Bed'),
        new SemanticCategory('Bench'),
        new SemanticCategory('Bicycle'),
        new SemanticCategory('Blanket'),
        new SemanticCategory('Blind'),
        new SemanticCategory('Boat'),
        new SemanticCategory('Book'),
        new SemanticCategory('Bookcase'),
        new SemanticCategory('Booth'),
        new SemanticCategory('Bottle'),
        new SemanticCategory('Box'),
        new SemanticCategory('Bridge'),
        new SemanticCategory('Buffet'),
        new SemanticCategory('Building'),
        new SemanticCategory('Bus'),
        new SemanticCategory('Cabinet'),
        new SemanticCategory('Canopy'),
        new SemanticCategory('Car'),
        new SemanticCategory('Case'),
        new SemanticCategory('Ceiling'),
        new SemanticCategory('Chair'),
        new SemanticCategory('Chandelier'),
        new SemanticCategory('Clock'),
        new SemanticCategory('Column'),
        new SemanticCategory('Computer'),
        new SemanticCategory('Counter'),
        new SemanticCategory('Countertop'),
        new SemanticCategory('Cradle'),
        new SemanticCategory('Curtain'),
        new SemanticCategory('Cushion'),
        new SemanticCategory('Desk'),
        new SemanticCategory('Dishwasher'),
        new SemanticCategory('Door'),
        new SemanticCategory('Earth'),
        new SemanticCategory('Escalator'),
        new SemanticCategory('Fan'),
        new SemanticCategory('Fence'),
        new SemanticCategory('Field'),
        new SemanticCategory('Fireplace'),
        new SemanticCategory('Flag'),
        new SemanticCategory('Floor'),
        new SemanticCategory('Flower'),
        new SemanticCategory('Food'),
        new SemanticCategory('Fountain'),
        new SemanticCategory('Glass'),
        new SemanticCategory('Grandstand'),
        new SemanticCategory('Grass'),
        new SemanticCategory('Hill'),
        new SemanticCategory('Hood'),
        new SemanticCategory('House'),
        new SemanticCategory('Hovel'),
        new SemanticCategory('Kitchen'),
        new SemanticCategory('Lake'),
        new SemanticCategory('Lamp'),
        new SemanticCategory('Land'),
        new SemanticCategory('Light'),
        new SemanticCategory('Microwave'),
        new SemanticCategory('Minibike'),
        new SemanticCategory('Mirror'),
        new SemanticCategory('Monitor'),
        new SemanticCategory('Mountain'),
        new SemanticCategory('Ottoman'),
        new SemanticCategory('Oven'),
        new SemanticCategory('Painting'),
        new SemanticCategory('Palm'),
        new SemanticCategory('Path'),
        new SemanticCategory('Person'),
        new SemanticCategory('Pier'),
        new SemanticCategory('Pillow'),
        new SemanticCategory('Plant'),
        new SemanticCategory('Plate'),
        new SemanticCategory('Plaything'),
        new SemanticCategory('Pole'),
        new SemanticCategory('Poster'),
        new SemanticCategory('Pot'),
        new SemanticCategory('Radiator'),
        new SemanticCategory('Refrigerator'),
        new SemanticCategory('River'),
        new SemanticCategory('Road'),
        new SemanticCategory('Rock'),
        new SemanticCategory('Rug'),
        new SemanticCategory('Runway'),
        new SemanticCategory('Sand'),
        new SemanticCategory('Sconce'),
        new SemanticCategory('Screen'),
        new SemanticCategory('Sculpture'),
        new SemanticCategory('Sea'),
        new SemanticCategory('Seat'),
        new SemanticCategory('Shelf'),
        new SemanticCategory('Ship'),
        new SemanticCategory('Shower'),
        new SemanticCategory('Sidewalk'),
        new SemanticCategory('Signboard'),
        new SemanticCategory('Sink'),
        new SemanticCategory('Sky'),
        new SemanticCategory('Skyscraper'),
        new SemanticCategory('Sofa'),
        new SemanticCategory('Stage'),
        new SemanticCategory('Stairs'),
        new SemanticCategory('Stairway'),
        new SemanticCategory('Step'),
        new SemanticCategory('Stool'),
        new SemanticCategory('Stove'),
        new SemanticCategory('Streetlight'),
        new SemanticCategory('Table'),
        new SemanticCategory('Tank'),
        new SemanticCategory('Television'),
        new SemanticCategory('Tent'),
        new SemanticCategory('Toilet'),
        new SemanticCategory('Towel'),
        new SemanticCategory('Tower'),
        new SemanticCategory('Tray'),
        new SemanticCategory('Tree'),
        new SemanticCategory('Truck'),
        new SemanticCategory('TV'),
        new SemanticCategory('Van'),
        new SemanticCategory('Vase'),
        new SemanticCategory('Wall'),
        new SemanticCategory('Wardrobe'),
        new SemanticCategory('Washer'),
        new SemanticCategory('Water'),
        new SemanticCategory('Waterfall'),
        new SemanticCategory('Windowpane')
    ];

    /** The color of this SemanticCategory. */
    public readonly color;

    /**
     * Name of the semantic category.
     *
     * @param name Name of the category.
     * @param _color Color of the category (pre-defined.).
     */
    constructor(public readonly name, _color?) {
        if (!_color) {
            _color = ColorUtil.randomColorHex();
        }
        this.color = _color;
    }
}