/* globals Craft, $ */
/**
 * SEO Redirects
 *
 * @author    Tam McDonald
 * @copyright Ether Creative 2017
 * @link      https://ethercreative.co.uk
 * @package   SEO
 * @since     2.0.0
 */
import { c } from "../helpers";

const REDIRECT_TYPES = {
	"301": "301 (Permanent)",
	"302": "302 (Temporary)",
};

export default class Redirects {
	
	constructor (namespace, csrf) {
		this.ns = namespace;
		this.csrf = csrf;
		
		this.table = document.getElementById(namespace + "-redirectTable");
		this.tableForm = document.getElementById(namespace + "-tableForm");
		this.newForm = document.getElementById(namespace + "-redirectsNew");
		this.bulkForm = document.getElementById(namespace + "-redirectsBulk");
		
		this.cancelCurrentEdit = () => {};
		this.editRow = null;
		
		this.tableForm.addEventListener("submit", this.onUpdate);
		this.newForm.addEventListener("submit", this.onSubmitNew);
		this.bulkForm.addEventListener("submit", this.onSubmitBulk);
		
		this.initTable();
	}
	
	initTable () {
		[].slice.call(this.table.getElementsByTagName("tr")).forEach(row => {
			const links = row.getElementsByTagName("a");
			
			links[0].addEventListener("click", e => {
				this.onEditClick(e, row);
			});
			
			links[1].addEventListener("click", e => {
				this.onDeleteClick(e, row);
			});
		});
	}
	
	// Events
	// =========================================================================
	
	onSubmitNew = e => {
		e.preventDefault();
		const form = e.target
			, spinner = form.getElementsByClassName("spinner")[0];
		
		const uri  = form.elements[this.namespaceField("uri")]
			, to   = form.elements[this.namespaceField("to")]
			, type = form.elements[this.namespaceField("type")];
		
		// Validate
		let valid = true;
		if (uri.value.trim() === "") {
			uri.classList.add("error");
			valid = false;
		} else uri.classList.remove("error");
		
		if (to.value.trim() === "") {
			to.classList.add("error");
			valid = false;
		} else to.classList.remove("error");
		
		if (!valid) return;
		
		// Submit
		spinner.classList.remove("hidden");
		
		this.post("POST", {
			uri: uri.value,
			to: to.value,
			type: type.value,
		}, ({ id }) => {
			this.table.appendChild(this.rowStatic(
				id, uri.value, to.value, type.value
			));
			
			Craft.cp.displayNotice(
				"<strong>SEO:</strong> Redirect added successfully!"
			);
			spinner.classList.add("hidden");
			
			form.reset();
			uri.focus();
		}, error => {
			Craft.cp.displayError("<strong>SEO:</strong> " + error);
			spinner.classList.add("hidden");
		});
	};
	
	onSubmitBulk = e => {
		e.preventDefault();
		const form = e.target
			, spinner = form.getElementsByClassName("spinner")[0];
		
		const redirects = form.elements[this.namespaceField("redirects")]
			, separator = form.elements[this.namespaceField("separator")]
			, type      = form.elements[this.namespaceField("type")];
		
		// Validate
		let valid = true;
		if (redirects.value.trim() === "") {
			redirects.classList.add("error");
			valid = false;
		} else redirects.classList.remove("error");
		
		if (separator.value === "") {
			separator.classList.add("error");
			valid = false;
		} else separator.classList.remove("error");
		
		if (!valid) return;
		
		// Submit
		spinner.classList.remove("hidden");
		
		this.post("PUT", {
			redirects: redirects.value,
			separator: separator.value,
			type: type.value,
		}, ({ redirects }) => {
			redirects.forEach(({ id, uri, to, type }) => {
				this.table.appendChild(this.rowStatic(
					id, uri, to, type
				));
			});
			
			Craft.cp.displayNotice('<strong>SEO:</strong> Redirects added successfully!');
			spinner.classList.add("hidden");
			
			form.reset();
		}, error => {
			Craft.cp.displayError('<strong>SEO:</strong> ' + error);
			spinner.classList.add("hidden");
		});
	};
	
	// TODO: Remove save / update boilerplate
	
	onUpdate = e => {
		e.preventDefault();
		const form = e.target
			, spinner = form.getElementsByClassName("spinner")[0];
		
		const id  = form.elements[this.namespaceField("id")]
			, uri  = form.elements[this.namespaceField("uri")]
			, to   = form.elements[this.namespaceField("to")]
			, type = form.elements[this.namespaceField("type")];
		
		// Validate
		let valid = true;
		if (uri.value.trim() === "") {
			uri.classList.add("error");
			valid = false;
		} else uri.classList.remove("error");
		
		if (to.value.trim() === "") {
			to.classList.add("error");
			valid = false;
		} else to.classList.remove("error");
		
		if (!valid) return;
		
		// Submit
		spinner.classList.remove("hidden");
		
		this.post("POST", {
			id: id.value,
			uri: uri.value,
			to: to.value,
			type: type.value,
		}, () => {
			const row = this.editRow;
			
			this.cancelCurrentEdit();
			
			this.table.insertBefore(
				this.rowStatic(
					id.value, uri.value, to.value, type.value
				),
				row
			);
			
			this.table.removeChild(row);
		}, error => {
			Craft.cp.displayError('<strong>SEO:</strong> ' + error);
			spinner.classList.add("hidden");
		});
	};
	
	onEditClick = (e, row) => {
		e.preventDefault();
		const { id, uri, to, type } = e.target.dataset;
		this.cancelCurrentEdit();
		
		const editRows = this.rowEdit(id, uri, to, type);
		
		this.editRow = row;
		
		this.cancelCurrentEdit = () => {
			this.table.insertBefore(row, editRows[0]);
			this.table.removeChild(editRows[0]);
			this.table.removeChild(editRows[1]);
			
			this.cancelCurrentEdit = () => {};
			this.editRow = null;
		};
		
		this.table.insertBefore(
			editRows[0],
			row
		);
		
		this.table.insertBefore(
			editRows[1],
			row
		);
		
		editRows[0].getElementsByTagName("input")[1].focus();
		
		this.table.removeChild(row);
	};
	
	onDeleteClick = (e, row) => {
		e.preventDefault();
		
		if (!confirm("Delete this redirect?"))
			return;
		
		this.post("DELETE", {
			id: row.dataset.id
		}, () => {
			Craft.cp.displayNotice('<strong>SEO:</strong> Redirect deleted');
			this.table.removeChild(row);
		}, error => {
			Craft.cp.displayNotice('<strong>SEO:</strong> ' + error);
		});
	};
	
	// Helpers
	// =========================================================================
	
	namespaceField (handle) {
		return `${this.ns}[${handle}]`;
	}
	
	post (
		method,
		fields = {},
		onSuccess = () => {},
		onError = () => {}
	) {
		const formData = new FormData()
			, jsonData = {};
		
		formData.append(this.csrf.name, this.csrf.token);
		jsonData[this.csrf.name] = this.csrf.token;
		
		Object.keys(fields).forEach(key => {
			if (fields.hasOwnProperty(key)) {
				formData.append(key, fields[key]);
				jsonData[key] = fields[key];
			}
		});
		
		$.ajax({
			type: method,
			url: window.location.href,
			dataType: 'json',
			data: jsonData,
		}).done((data, status) => {
			if (status === "success") {
				if (data.hasOwnProperty("success")) {
					onSuccess(data);
				} else if (data.hasOwnProperty("error")) {
					if (typeof data.error === typeof "") {
						onError(data.error);
					} else {
						onError(data.error[Object.keys(data.error)[0]][0]);
					}
				}
			} else {
				onError(data);
			}
		}).fail(() => {
			onError("An unknown error has occurred");
		});
	}
	
	rowStatic (id = -1, uri = "", to = "", type = 301) {
		const row = c("tr", { "tabindex": 0, "data-id": id }, [
			// URI
			c("td", { "class": "redirects--title-col" }, [
				c("div", { "class": "element small" }, [
					c("div", { "class": "label" }, [
						c("span", { "class": "title" }, [
							c("a", {
								"href": "#",
								"title": "Edit Redirect",
								"data-id": id,
								"data-uri": uri,
								"data-to": to,
								"data-type": type,
								"click": e => this.onEditClick(e, row)
							}, uri)
						])
					])
				])
			]),
			
			// To
			c("td", {}, to),
			
			// Type
			c("td", {}, REDIRECT_TYPES[type]),
			
			// Delete
			c("td", { "class": "thin action" }, [
				c("a", {
					"class": "delete icon",
					"title": "Delete",
					"click": e => this.onDeleteClick(e, row)
				})
			])
		]);
		
		return row;
	}
	
	rowEdit (id, uri, to, type) {
		return [
			c("tr", { "class": "redirects--edit-row" }, [
				// URI
				c("td", {}, [
					c("input", {
						"value": id,
						"type": "hidden",
						"name": this.namespaceField("id")
					}),
					c("input", {
						"value": uri,
						"type": "text",
						"class": "text fullwidth",
						"name": this.namespaceField("uri")
					}),
				]),
				
				// To
				c("td", {}, [
					c("input", {
						"value": to,
						"type": "text",
						"class": "text fullwidth",
						"name": this.namespaceField("to")
					}),
				]),
				
				// Type
				c("td", {}, [
					c("div", { "class": "select" }, [
						c("select", {
							"name": this.namespaceField("type")
						}, Object.keys(REDIRECT_TYPES).map(value => {
							const opts = { value };
							if (type === value) opts["selected"] = "selected";
							
							return c(
								"option",
								opts,
								REDIRECT_TYPES[value]
							);
						}))
					])
				]),
				
				// Spinner
				c("td", {}, [
					c("div", { "class": "spinner hidden" })
				])
			]),
			
			c("tr", { "class": "redirects--edit-controls" }, [
				c("td", { "colspan": 4 }, [
					c("input", {
						"class": "btn submit",
						"type": "submit",
						"value": "Update",
					}),
					c("input", {
						"class": "btn",
						"type": "button",
						"value": "Cancel",
						"click": () => { this.cancelCurrentEdit(); },
					}),
				])
			])
		];
	}
	
}