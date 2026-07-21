// app/admin/products/new/page.jsx - With image upload
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Package, 
  Plus, 
  Trash2,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    category: '',
    subCategory: '',
    price: '',
    unit: 'piece',
    stockQuantity: 0,
    stockStatus: 'in_stock',
    images: [],
    isFeatured: false,
    isActive: true,
    sortOrder: 0,
    metaTitle: '',
    metaDescription: ''
  });
  const [errors, setErrors] = useState({});
  const [imageUrls, setImageUrls] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value)
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      for (const file of files) {
        // Validate file
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit`);
          continue;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported image format`);
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/admin/products/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setImageUrls(prev => [...prev, data.url]);
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), data.url]
          }));
          toast.success(`Uploaded ${file.name}`);
        } else {
          const error = await res.json().catch(() => ({}));
          toast.error(error.error || `Failed to upload ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageRemove = async (index) => {
    const urlToRemove = imageUrls[index];
    
    try {
      const token = localStorage.getItem('accessToken');
      
      // Delete from server
      const res = await fetch(`/api/admin/products/upload?url=${encodeURIComponent(urlToRemove)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        }));
        toast.success('Image removed');
      } else {
        toast.error('Failed to remove image');
      }
    } catch (error) {
      console.error('Remove image error:', error);
      toast.error('Failed to remove image');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (imageUrls.length === 0) newErrors.images = 'At least one image is required';
    if (formData.price && isNaN(parseFloat(formData.price))) newErrors.price = 'Price must be a valid number';
    if (formData.stockQuantity && isNaN(parseFloat(formData.stockQuantity))) newErrors.stockQuantity = 'Stock quantity must be a valid number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
        sortOrder: parseInt(formData.sortOrder) || 0,
        images: imageUrls
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (res.ok) {
        toast.success('Product created successfully!');
        router.push('/admin/products');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
            <p className="text-muted mt-1">Create a new product for your catalog</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => {
                  handleChange(e);
                  if (!formData.slug || formData.slug === generateSlug(formData.name)) {
                    setFormData(prev => ({
                      ...prev,
                      slug: generateSlug(e.target.value)
                    }));
                  }
                }}
                className={`input-field w-full ${errors.name ? 'border-error' : ''}`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="product-slug"
              />
              <p className="text-xs text-muted mt-1">URL-friendly version of the product name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="l">Liter</option>
                <option value="ml">Milliliter</option>
                <option value="m">Meter</option>
                <option value="cm">Centimeter</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
                <option value="roll">Roll</option>
                <option value="sheet">Sheet</option>
                <option value="set">Set</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`input-field w-full ${errors.category ? 'border-error' : ''}`}
                placeholder="e.g., Building Materials"
              />
              {errors.category && <p className="text-xs text-error mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Sub Category
              </label>
              <input
                type="text"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="e.g., Cement"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Short Description
            </label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Brief summary (max 150 characters)"
              maxLength="150"
            />
            <p className="text-xs text-muted mt-1">{formData.shortDescription.length}/150 characters</p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Full Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field w-full min-h-[100px]"
              placeholder="Detailed product description..."
              rows="4"
            />
          </div>
        </Card>

        {/* Pricing & Stock */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Price (ETB)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleNumberChange}
                className={`input-field w-full ${errors.price ? 'border-error' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.price && <p className="text-xs text-error mt-1">{errors.price}</p>}
              <p className="text-xs text-muted mt-1">Leave empty for "Price on request"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleNumberChange}
                className={`input-field w-full ${errors.stockQuantity ? 'border-error' : ''}`}
                placeholder="0"
                step="1"
                min="0"
              />
              {errors.stockQuantity && <p className="text-xs text-error mt-1">{errors.stockQuantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Stock Status
              </label>
              <select
                name="stockStatus"
                value={formData.stockStatus}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="pre_order">Pre-Order</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Sort Order
              </label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleNumberChange}
                className="input-field w-full"
                placeholder="0"
                step="1"
                min="0"
              />
              <p className="text-xs text-muted mt-1">Lower numbers appear first</p>
            </div>
          </div>
        </Card>

        {/* Images - With File Upload */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Product Images</h2>
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg hover:border-primary/30 transition-colors">
              <Upload className="h-12 w-12 text-muted mb-4" />
              <p className="text-sm text-muted mb-2">Upload product images</p>
              <p className="text-xs text-muted mb-4">Supports JPG, PNG, WebP, GIF (Max 5MB each)</p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4" />
                      Select Images
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Image Preview Grid */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg bg-muted/10 overflow-hidden border border-border">
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" fill="%2364748b" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary/80 text-white text-[10px] rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {errors.images && <p className="text-xs text-error mt-1">{errors.images}</p>}
          </div>
        </Card>

        {/* SEO & Meta */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">SEO & Meta Data</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Meta Title
              </label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="SEO title (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                className="input-field w-full min-h-[80px]"
                placeholder="SEO description (optional)"
                rows="3"
              />
            </div>
          </div>
        </Card>

        {/* Status & Options */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Status & Options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Active</span>
                <p className="text-xs text-muted">Product visible to customers</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Featured</span>
                <p className="text-xs text-muted">Highlight on homepage</p>
              </div>
            </label>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link href="/admin/products">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading || uploading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}