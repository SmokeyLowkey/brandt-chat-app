# Document Upload Flow Modification Plan

## 1. Modify Document Upload Flow to Include Namespace Selection

### 1.1 Update Tenant Settings Model
- Add a new `documentNamespaces` field to the tenant settings object in the tenant model
- Update the default settings in the tenant creation API
- Ensure the field is properly handled in the tenant edit API

### 1.2 Update Tenant Edit UI
- Add a new section in the tenant edit page to manage document namespaces
- Implement UI for adding, editing, and removing namespaces
- Add appropriate validation and error handling

### 1.3 Modify File Uploader Component
- Update the `FileUploader` component to include a namespace dropdown
- Add an optional description field
- Ensure the selected namespace and description are passed to the document creation API
- Update the UI to accommodate these new fields
- Add validation to ensure a namespace is selected
- **Handle multiple file uploads**: Ensure the selected namespace and description are applied to all files in a batch upload
- Maintain a consistent UI experience whether uploading a single file or multiple files

### 1.4 Update Document Creation API
- Modify the document creation endpoint to accept and store the namespace and description
- Update the document metadata structure to include these new fields
- Ensure backward compatibility for existing documents

## 2. Fix User Icon in Header

### 2.1 Update Header Component
- Modify the user avatar in the header to use the user's image from the session if available
- Implement a fallback to initials only when no image is available
- Fix the styling of the initial badge to ensure it looks correct

## 3. Fix Back Button in Tenant/User Page

### 3.1 Update Navigation Logic
- Modify the back button in the tenant/user page to navigate to the tenants list instead of the tenant details
- Update the onClick handler to use the correct route

## 4. Add Tenant Edit Button

### 4.1 Add Edit Button to Tenant Details Page
- Add an edit button to the tenant details page
- Implement the functionality to enable editing of tenant details
- Ensure proper styling and positioning of the button

## Implementation Sequence

1. Start with the tenant settings model update to add document namespaces
2. Update the tenant edit UI to manage namespaces
3. Modify the file uploader component to include namespace selection and description
4. Update the document creation API to handle the new fields
5. Fix the user icon in the header
6. Fix the back button in the tenant/user page
7. Add the tenant edit button

## Technical Considerations

- Ensure backward compatibility for existing documents
- Implement proper validation for all new fields
- Use consistent styling across all components
- Ensure responsive design for all UI changes
- Add appropriate error handling and user feedback
- Handle batch uploads efficiently, applying the same namespace and description to all files