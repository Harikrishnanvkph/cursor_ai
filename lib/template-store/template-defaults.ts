import type { TemplateLayout } from "./template-types"

// Default templates based on the wireframes
export const defaultTemplates: TemplateLayout[] = [
    {
        id: "template-1",
        name: "Standard Report",
        description: "Chart with title, heading, and main explanation area",
        width: 1200,
        height: 800,
        chartArea: {
            x: 50,
            y: 120,
            width: 1100,
            height: 400
        },
        textAreas: [
            {
                id: "title-1",
                type: "title",
                content: "Chart Title",
                position: { x: 50, y: 20, width: 1100, height: 40 },
                style: {
                    fontSize: 28,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "bold",
                    color: "#000000",
                    textAlign: "center",
                    lineHeight: 1.2,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "heading-1",
                type: "heading",
                content: "Subtitle or Description",
                position: { x: 50, y: 70, width: 1100, height: 30 },
                style: {
                    fontSize: 16,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#666666",
                    textAlign: "center",
                    lineHeight: 1.3,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "main-1",
                type: "main",
                content: "Main explanation text area for detailed descriptions, analysis, or supporting information related to the chart above.",
                position: { x: 50, y: 540, width: 1100, height: 240 },
                style: {
                    fontSize: 14,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#333333",
                    textAlign: "left",
                    lineHeight: 1.5,
                    letterSpacing: 0
                },
                visible: true
            }
        ],
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 20
    },
    {
        id: "template-2",
        name: "Side-by-Side Layout",
        description: "Chart on left, text information on right",
        width: 1200,
        height: 800,
        chartArea: {
            x: 50,
            y: 50,
            width: 700,
            height: 700
        },
        textAreas: [
            {
                id: "title-2",
                type: "title",
                content: "Chart Title",
                position: { x: 800, y: 50, width: 350, height: 40 },
                style: {
                    fontSize: 24,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "bold",
                    color: "#000000",
                    textAlign: "left",
                    lineHeight: 1.2,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "heading-2",
                type: "heading",
                content: "Subtitle",
                position: { x: 800, y: 100, width: 350, height: 30 },
                style: {
                    fontSize: 16,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#666666",
                    textAlign: "left",
                    lineHeight: 1.3,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "main-2",
                type: "main",
                content: "Detailed explanation and analysis of the chart data. This area provides context, insights, and supporting information.",
                position: { x: 800, y: 150, width: 350, height: 600 },
                style: {
                    fontSize: 14,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#333333",
                    textAlign: "left",
                    lineHeight: 1.6,
                    letterSpacing: 0
                },
                visible: true
            }
        ],
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 20
    },
    {
        id: "template-3",
        name: "Compact Layout",
        description: "Chart with title, heading, custom text, and main explanation",
        width: 1200,
        height: 800,
        chartArea: {
            x: 400,
            y: 120,
            width: 750,
            height: 400
        },
        textAreas: [
            {
                id: "title-3",
                type: "title",
                content: "Chart Title",
                position: { x: 50, y: 20, width: 300, height: 40 },
                style: {
                    fontSize: 20,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "bold",
                    color: "#000000",
                    textAlign: "left",
                    lineHeight: 1.2,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "heading-3",
                type: "heading",
                content: "Subtitle",
                position: { x: 50, y: 70, width: 300, height: 30 },
                style: {
                    fontSize: 14,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#666666",
                    textAlign: "left",
                    lineHeight: 1.3,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "custom-3",
                type: "custom",
                content: "Custom text area for additional information or context.",
                position: { x: 50, y: 120, width: 300, height: 150 },
                style: {
                    fontSize: 12,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#555555",
                    textAlign: "left",
                    lineHeight: 1.4,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "main-3",
                type: "main",
                content: "Main explanation text area for detailed descriptions and analysis.",
                position: { x: 50, y: 540, width: 1100, height: 240 },
                style: {
                    fontSize: 14,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#333333",
                    textAlign: "left",
                    lineHeight: 1.5,
                    letterSpacing: 0
                },
                visible: true
            }
        ],
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 20
    },
    {
        id: "template-4",
        name: "Full Width Chart",
        description: "Chart spanning full width with text areas above and below",
        width: 1200,
        height: 800,
        chartArea: {
            x: 50,
            y: 120,
            width: 1100,
            height: 400
        },
        textAreas: [
            {
                id: "title-4",
                type: "title",
                content: "Chart Title",
                position: { x: 50, y: 20, width: 1100, height: 40 },
                style: {
                    fontSize: 28,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "bold",
                    color: "#000000",
                    textAlign: "center",
                    lineHeight: 1.2,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "heading-4",
                type: "heading",
                content: "Subtitle or Description",
                position: { x: 50, y: 70, width: 1100, height: 30 },
                style: {
                    fontSize: 16,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#666666",
                    textAlign: "center",
                    lineHeight: 1.3,
                    letterSpacing: 0
                },
                visible: true
            },
            {
                id: "main-4",
                type: "main",
                content: "Main explanation text area for detailed descriptions, analysis, or supporting information related to the chart above.",
                position: { x: 50, y: 540, width: 1100, height: 240 },
                style: {
                    fontSize: 14,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#333333",
                    textAlign: "left",
                    lineHeight: 1.5,
                    letterSpacing: 0
                },
                visible: true
            }
        ],
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 20
    }
]
