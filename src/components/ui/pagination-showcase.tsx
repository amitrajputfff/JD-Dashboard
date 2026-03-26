"use client"

import * as React from "react"
import { EnhancedPagination } from "./enhanced-pagination"
import { DataTablePagination } from "./data-table-pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { Separator } from "./separator"

export function PaginationShowcase() {
  const [currentPage1, setCurrentPage1] = React.useState(1)
  const [currentPage2, setCurrentPage2] = React.useState(1)
  const [currentPage3, setCurrentPage3] = React.useState(1)
  const [currentPage4, setCurrentPage4] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)

  const totalItems = 267
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const resetAll = () => {
    setCurrentPage1(1)
    setCurrentPage2(1)
    setCurrentPage3(1)
    setCurrentPage4(1)
  }

  const jumpToMiddle = () => {
    const middle = Math.ceil(totalPages / 2)
    setCurrentPage1(middle)
    setCurrentPage2(middle)
    setCurrentPage3(middle)
    setCurrentPage4(middle)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Pagination Component Comparison</h2>
        <p className="text-muted-foreground">
          Comparing the old DataTablePagination with the new EnhancedPagination component
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={resetAll}>Reset to Page 1</Button>
          <Button variant="outline" onClick={jumpToMiddle}>Jump to Middle</Button>
          <Badge variant="secondary">{totalItems} total items</Badge>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6">
        {/* Old DataTablePagination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Old DataTablePagination 
              <Badge variant="destructive">Legacy</Badge>
            </CardTitle>
            <CardDescription>
              The original pagination component with basic functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTablePagination
              currentPage={currentPage1}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage1}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[5, 10, 20, 50]}
              showItemsPerPage={true}
            />
          </CardContent>
        </Card>

        {/* Enhanced Pagination - Full Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              EnhancedPagination - Full Featured
              <Badge variant="default">New & Improved</Badge>
            </CardTitle>
            <CardDescription>
              Enhanced pagination with quick jump, keyboard navigation, and better mobile experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedPagination
              currentPage={currentPage2}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage2}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[5, 10, 20, 50]}
              showItemsPerPage={true}
              showQuickJump={true}
              showItemInfo={true}
              compact={false}
            />
          </CardContent>
        </Card>

        {/* Enhanced Pagination - Compact Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              EnhancedPagination - Compact Mode
              <Badge variant="secondary">Compact</Badge>
            </CardTitle>
            <CardDescription>
              Space-saving compact mode perfect for mobile or tight spaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedPagination
              currentPage={currentPage3}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage3}
              showItemsPerPage={false}
              showQuickJump={false}
              showItemInfo={true}
              compact={true}
            />
          </CardContent>
        </Card>

        {/* Enhanced Pagination - Minimal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              EnhancedPagination - Minimal
              <Badge variant="outline">Minimal</Badge>
            </CardTitle>
            <CardDescription>
              Minimal configuration with just navigation controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedPagination
              currentPage={currentPage4}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage4}
              showItemsPerPage={false}
              showQuickJump={false}
              showItemInfo={false}
              compact={false}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>✨ Key Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🚀 Enhanced Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Quick jump to any page with search input</li>
                <li>• Keyboard navigation (← → arrow keys)</li>
                <li>• Smart page number ellipsis</li>
                <li>• First/Last page buttons with tooltips</li>
                <li>• Better visual hierarchy and spacing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📱 Mobile Improvements:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Responsive layout (stacks on mobile)</li>
                <li>• Compact mode for limited space</li>
                <li>• Touch-friendly button sizes</li>
                <li>• Hidden elements on small screens</li>
                <li>• Better text wrapping and spacing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
