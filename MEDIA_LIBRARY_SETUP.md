# Media Library Setup Guide

## 🎯 Overview

The Media Library is a comprehensive media management system that allows users to:
- Upload, organize, and manage images, videos, and documents
- Browse and select media from a centralized library
- Track usage analytics and storage statistics
- Integrate seamlessly with the post creation workflow

## 📋 Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of setup-media-library-schema.sql
```

This will create:
- `media_library` table for storing media files
- `media_folders` table for organization
- `media_usage_logs` table for analytics
- Storage bucket `media-library`
- RLS policies for security
- Indexes for performance
- Helper functions for analytics

### 2. Storage Configuration

The setup script automatically creates a storage bucket called `media-library` with the following policies:
- Users can only access their own media files
- Public read access for media URLs
- Automatic folder organization by user ID

### 3. Environment Variables

Ensure your Supabase project has the following configured:
- Storage enabled
- RLS enabled on all tables
- Authentication configured

## 🚀 Features

### Core Functionality

#### 📁 Media Management
- **Upload**: Drag & drop or click to upload files
- **Organization**: Folder-based organization system
- **Search**: Full-text search across filenames and tags
- **Filtering**: Filter by type, folder, favorites
- **Bulk Operations**: Select multiple files for batch actions

#### 🎨 Media Types Supported
- **Images**: PNG, JPG, JPEG, GIF, WebP
- **Videos**: MP4, MOV, AVI, MKV
- **Documents**: PDF

#### 📊 Analytics Dashboard
- **Storage Statistics**: Total files, storage used, favorites
- **Usage Analytics**: Most used media, usage patterns
- **Recent Activity**: Latest uploads and activity
- **Storage Breakdown**: Usage by file type

#### 🔗 Integration Features
- **Create Post Integration**: Browse library when creating posts
- **Media Selector**: Popup selector for easy media selection
- **Usage Tracking**: Automatic tracking when media is used in posts
- **Favorites System**: Mark frequently used media as favorites

### Advanced Features

#### 🏷️ Metadata Management
- **Tags**: Add custom tags for better organization
- **Descriptions**: Add descriptions for context
- **Alt Text**: Accessibility support for images
- **Usage Counter**: Track how often media is used

#### 📱 User Experience
- **Grid/List Views**: Switch between visual layouts
- **Responsive Design**: Works on all screen sizes
- **Real-time Updates**: Live updates when media is added/removed
- **Progress Tracking**: Upload progress indicators

## 🎯 Usage Guide

### Accessing Media Library

1. **Navigation**: Click "Media Library" in the sidebar
2. **Direct URL**: Navigate to `/media`

### Uploading Media

1. **Click Upload**: Use the "Upload Media" button
2. **Drag & Drop**: Drag files directly into the upload area
3. **Browse Library**: Select from existing media when creating posts

### Organizing Media

1. **Folders**: Create folders for better organization
2. **Tags**: Add tags to media for easy searching
3. **Favorites**: Mark important media as favorites
4. **Bulk Actions**: Select multiple items for batch operations

### Using in Posts

1. **Create Post**: Go to create post page
2. **Add Image**: Click "Browse Library" in image section
3. **Select Media**: Choose from your media library
4. **Auto-tracking**: Usage is automatically tracked

## 🔧 Technical Details

### Database Schema

#### media_library table
- `id`: UUID primary key
- `user_id`: Reference to auth.users
- `name`: Original filename
- `url`: Public URL to file
- `type`: File type (image/video/document)
- `size`: File size in bytes
- `folder_id`: Optional folder reference
- `tags`: Array of tags
- `description`: Optional description
- `alt_text`: Accessibility text
- `usage_count`: Number of times used
- `is_favorite`: Favorite flag
- `created_at`, `updated_at`: Timestamps

#### media_folders table
- `id`: UUID primary key
- `user_id`: Reference to auth.users
- `name`: Folder name
- `description`: Optional description
- `parent_folder_id`: For nested folders
- `created_at`, `updated_at`: Timestamps

#### media_usage_logs table
- `id`: UUID primary key
- `media_id`: Reference to media_library
- `user_id`: Reference to auth.users
- `post_id`: Optional reference to posts
- `platform`: Platform where used
- `used_at`: Timestamp

### Storage Structure

```
media-library/
├── {user-id}/
│   ├── {timestamp}-{random}.{ext}
│   └── ...
```

### Security

- **Row Level Security**: Users can only access their own media
- **Storage Policies**: Automatic user-based access control
- **File Validation**: Type and size validation on upload
- **Secure URLs**: Public URLs with proper access control

## 🎨 UI Components

### MediaLibrary.tsx
Main component with full media management interface

### MediaSelector.tsx
Popup selector for choosing media in other components

### MediaAnalytics.tsx
Analytics dashboard for usage statistics

## 🔄 Integration Points

### Create Post Integration
- Browse library button in image selection
- Automatic usage tracking when media is selected
- Preview integration with platform-specific layouts

### Future Integrations
- Bulk post creation with multiple media
- Media templates and presets
- Advanced editing capabilities
- CDN integration for faster loading

## 📈 Performance Considerations

- **Lazy Loading**: Images load as needed
- **Pagination**: Large libraries are paginated
- **Caching**: Browser caching for frequently accessed media
- **Compression**: Automatic image optimization
- **Indexes**: Database indexes for fast queries

## 🛠️ Maintenance

### Regular Tasks
- Monitor storage usage
- Clean up unused media (optional function provided)
- Review analytics for optimization opportunities
- Update tags and organization as needed

### Monitoring
- Track storage costs
- Monitor upload/download patterns
- Review user feedback for improvements
- Performance monitoring for large libraries

## 🎉 Benefits

1. **Centralized Management**: All media in one place
2. **Improved Workflow**: Faster post creation with existing media
3. **Better Organization**: Folders, tags, and search capabilities
4. **Usage Insights**: Analytics to understand media performance
5. **Storage Efficiency**: Reuse media across multiple posts
6. **Professional Appearance**: Consistent branding with organized assets

The Media Library transforms the content creation workflow by providing a professional-grade media management system that scales with your needs!
