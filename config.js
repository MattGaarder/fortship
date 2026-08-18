const PORT_CONFIG = {
    Mucuripe: {
        title: "Port of Fortaleza",
        image: "mucuripe.png",
        coordinates: {
            lat: -3.7014,
            lon: -38.4754
        }
    },

    Pecem: {
        title: "Port of Pecém",
        image: "pecem.png",
        coordinates: {
            lat: -3.5447,
            lon: -38.8183
        }
    },

    VDC: {
        title: "Port of Vila do Conde",
        image: "vdc.png",
        coordinates: {
            lat: -1.5445,
            lon: -48.7539
        }
    },

    "Tank Pier": {
        title: "Port of Mucuripe",
        image: "mucuripe-2.png",
        coordinates: {
            lat: -3.7014,
            lon: -38.4754
        }
    },

    PE: {
        title: "Port of Recife",
        image: "recife.png",
        coordinates: {
            lat: -8.0476,
            lon: -34.8770
        }
    }
};

function getPortConfig(sheetName, isPreview = false) {
    const config = PORT_CONFIG[sheetName];

    if (!config) {
        if (isPreview) {
            return PORT_CONFIG.Pecem;
        }

        throw new Error(
            `No port configuration found for sheet: "${sheetName}"`
        );
    }

    return config;
}

module.exports = {
    PORT_CONFIG,
    getPortConfig
};