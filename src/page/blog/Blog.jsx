import React, { useState } from "react";
import { Navigate } from "../../Navigate"; // adjust path if needed
import { Input, Modal, Form, Upload, Spin, message, Pagination } from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import JoditEditor from "jodit-react";
import {
  useAddBlogsMutation,
  useDeleteBlogsMutation,
  useGetBlogsQuery,
  useUpdateBlogsMutation,
} from "../redux/api/blogApi";
import { imageUrl } from "../redux/api/baseApi";
import { EyeIcon } from "lucide-react";
import { Link } from "react-router-dom";

const Blog = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: blogData, refetch } = useGetBlogsQuery({
    search,
    page: currentPage,
    limit: pageSize,
  });

  const [addBlogs] = useAddBlogsMutation();
  const [updateBlogs] = useUpdateBlogsMutation();
  const [deleteBlogs] = useDeleteBlogsMutation();

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const [fileList, setFileList] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const onPreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteBlogs(id).unwrap();
      message.success(res.message);
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to delete");
    }
  };

 const config = {
  readonly: false,
  placeholder: "Start typing...",
  height: 600,
  width: "100%",


  
  iframeStyle: `
    body {
      max-width: 100%;
      margin: 0 auto;
      padding: 16px;
      box-sizing: border-box;
      overflow-x: hidden;
    }

    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
    }

    table {
      max-width: 100%;
      overflow-x: auto;
      display: block;
    }
  `,

  buttons: [
    "undo",
    "redo",
    "|",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "|",
    "fontsize",
    "font",
    "brush",
    "|",
    "align",
    "outdent",
    "indent",
    "|",
    "ul",
    "ol",
    "|",
    "table",
    "|",
    "image",
    "link",
    "|",
    "hr",
    "eraser",
    "copyformat",
    "|",
    "fullsize",
    "preview",
  ],

  toolbarAdaptive: false,
  toolbarSticky: true,
};


  const handleAdd = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (fileList.length > 0) {
        formData.append("image", fileList[0].originFileObj);
      }
      formData.append("title", values.title);
      formData.append("content", content);

      // Debug (uncomment when needed)
      // console.log("Adding → Title:", values.title);
      // console.log("Content length:", content?.length);
      // console.log("Content preview:", content?.substring(0, 150));

      const res = await addBlogs(formData).unwrap();
      message.success(res.message || "Blog added successfully");
      setOpenAddModal(false);
      form.resetFields();
      setFileList([]);
      setContent("");
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to add blog");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Only append new image if user selected one
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("image", fileList[0].originFileObj);
      }

      formData.append("title", values.title);
      formData.append("content", content);

      // Debug (uncomment when needed)
      // console.log("Editing → Title:", values.title);
      // console.log("Content length:", content?.length);

      const res = await updateBlogs({
        id: selectedBlog._id,
        data: formData,
      }).unwrap();

      message.success(res.message || "Blog updated successfully");
      setOpenEditModal(false);
      form.resetFields();
      setFileList([]);
      setContent("");
      setSelectedBlog(null);
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to update blog");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="bg-white p-3 h-[87vh] overflow-auto">
      <div className="flex justify-between mb-4">
        <Navigate title="Blog" />
        <div className="flex gap-5">
          <Input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            prefix={<SearchOutlined />}
            style={{ maxWidth: "500px", height: "40px" }}
          />
          <button
            onClick={() => setOpenAddModal(true)}
            className="bg-[#E63946] w-[150px] text-white py-2 rounded hover:bg-[#c62839] transition"
          >
            Add Blog
          </button>
        </div>
      </div>

      {/* Blog Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {blogData?.data?.map((blog) => (
          <div key={blog._id} className="border rounded-lg p-3 flex flex-col shadow-sm hover:shadow-md transition">
            <img
              src={`${imageUrl}${blog.imageUrl}`}
              alt={blog.title}
              className="h-80 w-full object-cover rounded mb-3"
            />
            <h3 className="font-semibold text-lg line-clamp-2 mb-3">{blog.title}</h3>
            <div className="flex justify-end gap-2 mt-auto">
              <button
                onClick={() => {
                  setSelectedBlog(blog);
                  form.setFieldsValue({ title: blog.title });
                  setContent(blog.content || "");
                  setFileList([
                    {
                      uid: "-1",
                      name: blog.imageUrl.split("/").pop() || "image.jpg",
                      status: "done",
                      url: `${imageUrl}${blog.imageUrl}`,
                    },
                  ]);
                  setOpenEditModal(true);
                }}
                className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
              >
                <EditOutlined />
              </button>

              <button
                onClick={() => handleDelete(blog._id)}
                className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700"
              >
                <DeleteOutlined />
              </button>

              <Link to={`/dashboard/blog-details/${blog?._id}`}>
                <button className="bg-sky-500 text-white py-1 px-3 rounded hover:bg-sky-600">
                  <EyeIcon size={16} />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={blogData?.meta?.total || 0}
          onChange={handlePageChange}
          showSizeChanger={false}
        />
      </div>

      {/* Add Modal */}
      <Modal
        centered
        open={openAddModal}
        onCancel={() => setOpenAddModal(false)}
        footer={null}
        width={'100%'}
        
      >
        <h2 className="text-center font-bold text-xl mb-6">+ Add New Blog</h2>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Please enter blog title" }]}
          >
            <Input placeholder="Blog title" style={{ height: "40px" }} />
          </Form.Item>

          <Form.Item label="Cover Image">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              onPreview={onPreview}
              maxCount={1}
              beforeUpload={() => false} // prevent auto upload
            >
              {fileList.length < 1 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="Content">
            <JoditEditor
              config={config}
              value={content}
              onBlur={(newContent) => setContent(newContent)}
              
              // tabIndex={1} // optional: enables tab navigation
            />
          </Form.Item>

          <button
            className={`w-full py-3 rounded text-white flex justify-center items-center gap-2 transition-all ${
              loading
                ? "bg-[#fa8e97] cursor-not-allowed"
                : "bg-[#E63946] hover:bg-[#941822]"
            }`}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spin size="small" />
                <span>Submitting...</span>
              </>
            ) : (
              "Create Blog"
            )}
          </button>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        centered
        open={openEditModal}
        onCancel={() => setOpenEditModal(false)}
        footer={null}
      width={'100%'}
      
      >
        <h2 className="text-center font-bold text-xl mb-6">Edit Blog</h2>
        <Form  form={form} layout="vertical" onFinish={handleEdit}>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Please enter blog title" }]}
          >
            <Input placeholder="Blog title" style={{ height: "40px" }} />
          </Form.Item>

          <Form.Item label="Cover Image">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              onPreview={onPreview}
              maxCount={1}
              beforeUpload={() => false}
            >
              {fileList.length < 1 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload new</div>
                </div>
              )}
            </Upload>
          </Form.Item>

      <div >
            <Form.Item label="Content">
            <JoditEditor
              config={config}
              value={content}
              onBlur={(newContent) => setContent(newContent)}
            />
          </Form.Item>
      </div>

          <button
            className={`w-full py-3 rounded text-white flex justify-center items-center gap-2 transition-all ${
              loading
                ? "bg-[#fa8e97] cursor-not-allowed"
                : "bg-[#E63946] hover:bg-[#941822]"
            }`}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spin size="small" />
                <span>Updating...</span>
              </>
            ) : (
              "Update Blog"
            )}
          </button>
        </Form>
      </Modal>
    </div>
  );
};

export default Blog;