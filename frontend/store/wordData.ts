export interface WordEntry {
    word: string;
    group: string;
    synonyms: string[];
}

export const WORD_DATA: WordEntry[] = [
    { word: "Doctor", group: "medical", synonyms: ["Nurse", "Surgeon", "Medic", "Hospital"] },
    { word: "Happy", group: "emotion", synonyms: ["Joy", "Glad", "Smile", "Delight"] },
    { word: "Car", group: "vehicle", synonyms: ["Bus", "Truck", "Taxi", "Drive"] },
    { word: "Ocean", group: "nature", synonyms: ["Sea", "Water", "Wave", "Blue"] },
    { word: "King", group: "royal", synonyms: ["Queen", "Prince", "Crown", "Throne"] },
    { word: "Computer", group: "tech", synonyms: ["Laptop", "Screen", "Code", "Mouse"] },
    { word: "Music", group: "art", synonyms: ["Song", "Radio", "Melody", "Band"] },
    { word: "Tree", group: "nature", synonyms: ["Plant", "Leaf", "Forest", "Wood"] },
    { word: "Night", group: "time", synonyms: ["Dark", "Moon", "Sleep", "Star"] },
    { word: "Money", group: "wealth", synonyms: ["Cash", "Gold", "Coin", "Rich"] },
    { word: "Fire", group: "element", synonyms: ["Flame", "Burn", "Heat", "Hot"] },
    { word: "Love", group: "emotion", synonyms: ["Heart", "Kiss", "Like", "Hug"] },
    { word: "Cold", group: "sensation", synonyms: ["Ice", "Snow", "Freeze", "Cool"] },
    { word: "Run", group: "action", synonyms: ["Walk", "Jog", "Sprint", "Race"] },
    { word: "School", group: "place", synonyms: ["Class", "Study", "Teacher", "Exam"] },
    { word: "Dog", group: "animal", synonyms: ["Cat", "Puppy", "Pet", "Bark"] },
    { word: "Book", group: "object", synonyms: ["Read", "Page", "Paper", "Story"] },
    { word: "Coffee", group: "drink", synonyms: ["Tea", "Cafe", "Cup", "Bean"] },
    { word: "Phone", group: "tech", synonyms: ["Call", "Mobile", "App", "Talk"] },
    { word: "City", group: "place", synonyms: ["Town", "Urban", "Street", "Building"] },
    { word: "Light", group: "element", synonyms: ["Sun", "Lamp", "Bright", "Shine"] },
    { word: "Time", group: "concept", synonyms: ["Clock", "Hour", "Past", "Watch"] },
    { word: "Game", group: "activity", synonyms: ["Play", "Sport", "Match", "Fun"] },
    { word: "House", group: "place", synonyms: ["Home", "Room", "Door", "Roof"] },
    { word: "Chair", group: "object", synonyms: ["Seat", "Sofa", "Table", "Sit"] },
    { word: "Food", group: "consumable", synonyms: ["Eat", "Meal", "Bread", "Cook"] },
    { word: "Dream", group: "mind", synonyms: ["Sleep", "Wish", "Night", "Hope"] },
    { word: "Sky", group: "nature", synonyms: ["Cloud", "Blue", "Air", "High"] },
    { word: "Friend", group: "social", synonyms: ["Pal", "Mate", "Buddy", "Help"] },
    { word: "Red", group: "color", synonyms: ["Blue", "Green", "Color", "Rose"] }, // Color Trap
];
