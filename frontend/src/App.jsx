import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";

function App() {
  const [products, setProducts] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(
    localStorage.getItem("username")
  );

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState("2026-09-14");
  const [expiryDate, setExpiryDate] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // --------------------------------------------------
  // GET ACCESS TOKEN
  // --------------------------------------------------

  const getToken = () => {
    return localStorage.getItem("accessToken");
  };

  // --------------------------------------------------
  // REFRESH ACCESS TOKEN
  // --------------------------------------------------

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(
        "https://expiryalert-backend.onrender.com/api/auth/token/refresh/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      localStorage.setItem("accessToken", data.access);

      return data.access;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");

    setLoggedInUser(null);
    setProducts([]);
  };

  // --------------------------------------------------
  // FETCH PRODUCTS
  // --------------------------------------------------

  const fetchProducts = async () => {
    let token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
      let response = await fetch(
        "https://expiryalert-backend.onrender.com/api/products/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If access token expired
      if (response.status === 401) {
        token = await refreshAccessToken();

        if (!token) {
          logout();
          return;
        }

        // Try again with new access token
        response = await fetch(
          "https://expiryalert-backend.onrender.com/api/products/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // --------------------------------------------------
  // LOAD PRODUCTS WHEN USER LOGS IN
  // --------------------------------------------------

  useEffect(() => {
    if (!loggedInUser) {
      return;
    }

    fetchProducts();
  }, [loggedInUser]);

  // --------------------------------------------------
  // ADD PRODUCT
  // --------------------------------------------------

  const addProduct = async (e) => {
    e.preventDefault();

    let token = getToken();

    if (!token) {
      logout();
      return;
    }

    const formData = new FormData();

    formData.append("name", name);
    formData.append("brand", brand);
    formData.append("category", category);
    formData.append("quantity", quantity);
    formData.append("purchase_date", purchaseDate);
    formData.append("expiry_date", expiryDate);
    formData.append("storage_location", storageLocation);
    formData.append("notes", notes);

    if (image) {
      formData.append("image", image);
    }

    try {
      let response = await fetch(
        "https://expiryalert-backend.onrender.com/api/products/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      // If access token expired
      if (response.status === 401) {
        token = await refreshAccessToken();

        if (!token) {
          logout();
          return;
        }

        // Try POST again with refreshed token
        response = await fetch(
          "https://expiryalert-backend.onrender.com/api/products/",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        console.error("Backend error:", errorData);

        throw new Error("Failed to add product");
      }

      const data = await response.json();

      setProducts((prevProducts) => [
        ...prevProducts,
        data,
      ]);

      // Reset form
      setName("");
      setBrand("");
      setCategory("");
      setQuantity(1);
      setPurchaseDate("2026-09-14");
      setExpiryDate("");
      setStorageLocation("");
      setNotes("");
      setImage(null);

      const imageInput = document.getElementById("imageInput");

      if (imageInput) {
        imageInput.value = "";
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // --------------------------------------------------
  // DASHBOARD COUNTS
  // --------------------------------------------------

  const safe = products.filter(
    (product) => product.expiry_status === "Safe"
  ).length;

  const expiringSoon = products.filter(
    (product) => product.expiry_status === "Expiring Soon"
  ).length;

  const expired = products.filter(
    (product) => product.expiry_status === "Expired"
  ).length;

  // --------------------------------------------------
  // USE FIRST PRODUCTS
  // --------------------------------------------------

  const useFirstProducts = [...products]
    .filter(
      (product) =>
        product.expiry_status === "Expiring Soon"
    )
    .sort(
      (a, b) =>
        new Date(a.expiry_date) -
        new Date(b.expiry_date)
    );

  // --------------------------------------------------
  // ALERT MESSAGE
  // --------------------------------------------------

  const getAlertMessage = (product) => {
    const today = new Date();
    const expiry = new Date(product.expiry_date);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const daysLeft = Math.round(
      (expiry - today) /
        (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      return "🔴 This product has expired!";
    }

    if (daysLeft === 0) {
      return "🔴 This product expires today!";
    }

    if (daysLeft <= 3) {
      return `🔴 Expires in ${daysLeft} day${
        daysLeft > 1 ? "s" : ""
      }! Use it soon.`;
    }

    return `🟡 Expires in ${daysLeft} days. Consider using it soon.`;
  };

  // --------------------------------------------------
  // DELETE PRODUCT
  // --------------------------------------------------

  const deleteProduct = async (id) => {
    let token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
      let response = await fetch(
        `https://expiryalert-backend.onrender.com/api/products/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh token if expired
      if (response.status === 401) {
        token = await refreshAccessToken();

        if (!token) {
          logout();
          return;
        }

        response = await fetch(
          `https://expiryalert-backend.onrender.com/api/products/${id}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts((prevProducts) =>
        prevProducts.filter(
          (product) => product.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Error deleting product:",
        error
      );
    }
  };

  // --------------------------------------------------
  // EDIT PRODUCT
  // --------------------------------------------------

  const editProduct = async (product) => {
    const newName = prompt(
      "Enter product name:",
      product.name
    );

    if (!newName || newName.trim() === "") {
      return;
    }

    let token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
      let response = await fetch(
        `https://expiryalert-backend.onrender.com/api/products/${product.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newName.trim(),
          }),
        }
      );

      // Refresh token if expired
      if (response.status === 401) {
        token = await refreshAccessToken();

        if (!token) {
          logout();
          return;
        }

        response = await fetch(
          `https://expiryalert-backend.onrender.com/api/products/${product.id}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: newName.trim(),
            }),
          }
        );
      }

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const data = await response.json();

      setProducts((prevProducts) =>
        prevProducts.map((item) =>
          item.id === product.id
            ? data
            : item
        )
      );
    } catch (error) {
      console.error(
        "Error updating product:",
        error
      );
    }
  };

  // --------------------------------------------------
  // FILTER PRODUCTS
  // --------------------------------------------------

  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "" ||
        product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "" ||
        product.expiry_status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    }
  );

  // --------------------------------------------------
  // LOGIN SCREEN
  // --------------------------------------------------

  if (!loggedInUser) {
    return (
      <Login
        onLogin={setLoggedInUser}
      />
    );
  }

  // --------------------------------------------------
  // MAIN APP
  // --------------------------------------------------

  return (
    <div className="container">

      {/* HEADER */}

      <div className="header">
        <h1>ExpiryAlert</h1>

        <p>
          Household Expiry Manager
        </p>

        <p>
          Welcome,{" "}
          <strong>
            {loggedInUser}
          </strong>{" "}
          👋
        </p>

        <button onClick={logout}>
          Logout
        </button>
      </div>

      {/* ADD PRODUCT */}

      <h2>Add Product</h2>

      <form onSubmit={addProduct}>

        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          required
        />

        <input
          type="text"
          placeholder="Brand"
          value={brand}
          onChange={(e) =>
            setBrand(e.target.value)
          }
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          required
        >
          <option value="">
            Select Category
          </option>

          <option value="Food">
            Food
          </option>

          <option value="Medicine">
            Medicine
          </option>

          <option value="Cosmetics">
            Cosmetics
          </option>

          <option value="Cleaning">
            Cleaning
          </option>

          <option value="Personal Care">
            Personal Care
          </option>

          <option value="Other">
            Other
          </option>
        </select>

        <input
          type="number"
          placeholder="Quantity"
          min="1"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value)
          }
          required
        />

        <input
          type="date"
          value={purchaseDate}
          onChange={(e) =>
            setPurchaseDate(e.target.value)
          }
          required
        />

        <input
          type="date"
          value={expiryDate}
          onChange={(e) =>
            setExpiryDate(e.target.value)
          }
          required
        />

        <input
          type="text"
          placeholder="Storage Location"
          value={storageLocation}
          onChange={(e) =>
            setStorageLocation(e.target.value)
          }
        />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
        />

        <input
          id="imageInput"
          type="file"
          accept="image/*"
          onChange={(e) =>
            setImage(e.target.files[0])
          }
        />

        <button type="submit">
          Add Product
        </button>

      </form>

      {/* DASHBOARD */}

      <h2>Dashboard</h2>

      <div className="dashboard">

        <div className="card">
          <h3>Total Products</h3>
          <p>{products.length}</p>
        </div>

        <div className="card">
          <h3>Safe</h3>
          <p>{safe}</p>
        </div>

        <div className="card">
          <h3>Expiring Soon</h3>
          <p>{expiringSoon}</p>
        </div>

        <div className="card">
          <h3>Expired</h3>
          <p>{expired}</p>
        </div>

      </div>

      {/* USE FIRST */}

      <h2>⚠️ Use First</h2>

      <div className="products">

        {useFirstProducts.length === 0 ? (
          <p>
            No products need immediate attention.
          </p>
        ) : (
          useFirstProducts.map(
            (product) => {

              const today = new Date();
              const expiry = new Date(
                product.expiry_date
              );

              today.setHours(
                0,
                0,
                0,
                0
              );

              expiry.setHours(
                0,
                0,
                0,
                0
              );

              const daysLeft = Math.round(
                (expiry - today) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  className="product-card"
                  key={product.id}
                >

                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                    />
                  )}

                  <h3>
                    {product.name}
                  </h3>

                  <p>
                    <strong>
                      Expiry:
                    </strong>{" "}
                    {product.expiry_date}
                  </p>

                  <p>
                    <strong>
                      Days Left:
                    </strong>{" "}
                    {daysLeft}
                  </p>

                  <p className="status expiring-soon">
                    ⚠️ Use this product soon
                  </p>

                  <p className="alert-message">
                    {getAlertMessage(product)}
                  </p>

                </div>
              );
            }
          )
        )}

      </div>

      {/* PRODUCTS */}

      <h2>Products</h2>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      <select
        value={categoryFilter}
        onChange={(e) =>
          setCategoryFilter(e.target.value)
        }
      >
        <option value="">
          All Categories
        </option>

        <option value="Food">
          Food
        </option>

        <option value="Medicine">
          Medicine
        </option>

        <option value="Cosmetics">
          Cosmetics
        </option>

        <option value="Cleaning">
          Cleaning
        </option>

        <option value="Personal Care">
          Personal Care
        </option>

        <option value="Other">
          Other
        </option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) =>
          setStatusFilter(e.target.value)
        }
      >
        <option value="">
          All Status
        </option>

        <option value="Safe">
          Safe
        </option>

        <option value="Expiring Soon">
          Expiring Soon
        </option>

        <option value="Expired">
          Expired
        </option>
      </select>

      <div className="products">

        {filteredProducts.length === 0 ? (
          <p>
            No products found.
          </p>
        ) : (
          filteredProducts.map(
            (product) => {

              const today = new Date();
              const expiry = new Date(
                product.expiry_date
              );

              today.setHours(
                0,
                0,
                0,
                0
              );

              expiry.setHours(
                0,
                0,
                0,
                0
              );

              const daysLeft = Math.round(
                (expiry - today) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  className="product-card"
                  key={product.id}
                >

                  {/* PRODUCT IMAGE */}

                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                    />
                  )}

                  <h3>
                    {product.name}
                  </h3>

                  <p>
                    <strong>
                      Brand:
                    </strong>{" "}
                    {product.brand ||
                      "Not specified"}
                  </p>

                  <p>
                    <strong>
                      Category:
                    </strong>{" "}
                    {product.category}
                  </p>

                  <p>
                    <strong>
                      Quantity:
                    </strong>{" "}
                    {product.quantity}
                  </p>

                  <p>
                    <strong>
                      Purchase Date:
                    </strong>{" "}
                    {product.purchase_date}
                  </p>

                  <p>
                    <strong>
                      Storage:
                    </strong>{" "}
                    {product.storage_location ||
                      "Not specified"}
                  </p>

                  <p>
                    <strong>
                      Notes:
                    </strong>{" "}
                    {product.notes ||
                      "No notes"}
                  </p>

                  <p>
                    <strong>
                      Expiry:
                    </strong>{" "}
                    {product.expiry_date}
                  </p>

                  <p>
                    <strong>
                      Days Left:
                    </strong>{" "}
                    {daysLeft}
                  </p>

                  <p
                    className={`status ${product.expiry_status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    Status:{" "}
                    {product.expiry_status}
                  </p>

                  <p className="alert-message">
                    {getAlertMessage(product)}
                  </p>

                  <button
                    onClick={() =>
                      editProduct(product)
                    }
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteProduct(product.id)
                    }
                  >
                    Delete
                  </button>

                </div>
              );
            }
          )
        )}

      </div>

    </div>
  );
}

export default App;