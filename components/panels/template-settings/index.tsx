"use client"

import React from "react"
import { TemplateListTab } from "./template-list-tab"
import { FormatZonesPanel } from "../template-panels/format-zones-panel"

export function TemplatesPanel() {
    return (
        <div className="space-y-4">
            <TemplateListTab />
        </div>
    )
}

export function TemplateContentPanel() {
    return <FormatZonesPanel />
}
