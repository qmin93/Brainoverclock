// Hard-coded diverse dataset with semantic relations
export const WORD_DATA = [
    { word: "Apple", related: ["Pear", "Banana", "Fruit", "Pie"] },
    { word: "Doctor", related: ["Nurse", "Hospital", "Surgeon", "Medicine"] },
    { word: "Car", related: ["Bus", "Truck", "Driving", "Wheel"] },
    { word: "Happy", related: ["Smile", "Joy", "Laugh", "Glad"] },
    { word: "Ocean", related: ["Sea", "Water", "Blue", "Fish"] },
    { word: "King", related: ["Queen", "Prince", "Crown", "Throne"] },
    { word: "Computer", related: ["Laptop", "Screen", "Keyboard", "Mouse"] },
    { word: "Music", related: ["Song", "Radio", "Sound", "Band"] },
    { word: "Book", related: ["Read", "Page", "Library", "Story"] },
    { word: "Tree", related: ["Leaf", "Green", "Forest", "Wood"] },
    // Lookalikes (Manual definition or we just trust the randomness? PRD mentions synonyms mostly)
    // Let's stick to semantic trap as primary feature.
    { word: "Night", related: ["Day", "Dark", "Moon", "Sleep"] },
    { word: "School", related: ["Class", "Teacher", "Student", "Study"] },
    { word: "Money", related: ["Cash", "Bank", "Gold", "Rich"] },
    { word: "Fire", related: ["Hot", "Burn", "Flame", "Red"] },
    { word: "Love", related: ["Heart", "Kiss", "Hug", "Like"] },
    { word: "Cat", related: ["Dog", "Pet", "Meow", "Kitten"] },
    { word: "Run", related: ["Walk", "Jog", "Fast", "Race"] },
    { word: "Cold", related: ["Ice", "Snow", "Freeze", "Winter"] },
    { word: "Sun", related: ["Star", "Sky", "Light", "Shine"] },
    { word: "Bird", related: ["Fly", "Wing", "Nest", "Egg"] },
    { word: "House", related: ["Home", "Build", "Roof", "Door"] }, // Trap for Horse (if we added it)
    { word: "Horse", related: ["Ride", "Pony", "Cowboy", "Farm"] },
    { word: "Chair", related: ["Seat", "Sit", "Table", "Sofa"] },
    { word: "Phone", related: ["Call", "Talk", "Cell", "Mobile"] },
    { word: "Shoe", related: ["Foot", "Boot", "Sock", "Walk"] },
];
