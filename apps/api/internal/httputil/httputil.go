package httputil

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// Block Standard: BLOCK_HTTP_RESPONSE_UTIL_001

type contextKey string

const (
	RequestIDKey contextKey = "request_id"
	StartTimeKey contextKey = "start_time"
)

// ProblemDetail represents an RFC 7807 Problem Details response.
type ProblemDetail struct {
	Type          string                 `json:"type"`
	Title         string                 `json:"title"`
	Status        int                    `json:"status"`
	Detail        string                 `json:"detail"`
	Instance      string                 `json:"instance,omitempty"`
	Code          string                 `json:"code,omitempty"`
	InvalidParams []InvalidParam         `json:"invalidParams,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	RequestID     string                 `json:"requestId,omitempty"`
	Timestamp     string                 `json:"timestamp"`
}

// InvalidParam details a specific field validation failure.
type InvalidParam struct {
	Name          string      `json:"name"`
	Reason        string      `json:"reason"`
	ReceivedValue interface{} `json:"receivedValue,omitempty"`
}

// PaginationParams captures standardized query parameters for list endpoints.
type PaginationParams struct {
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
	Search   string `json:"search,omitempty"`
	Sort     string `json:"sort,omitempty"`
	Category string `json:"category,omitempty"`
	Cursor   string `json:"cursor,omitempty"`
}

// PaginationMeta provides pagination navigation details.
type PaginationMeta struct {
	Page            int     `json:"page"`
	PageSize        int     `json:"pageSize"`
	TotalCount      int     `json:"totalCount"`
	TotalPages      int     `json:"totalPages"`
	HasNextPage     bool    `json:"hasNextPage"`
	HasPreviousPage bool    `json:"hasPreviousPage"`
	NextPage        *int    `json:"nextPage,omitempty"`
	PreviousPage    *int    `json:"previousPage,omitempty"`
	NextCursor      *string `json:"nextCursor,omitempty"`
	PreviousCursor  *string `json:"previousCursor,omitempty"`
}

// ResponseMeta provides standard request execution telemetry.
type ResponseMeta struct {
	RequestID       string  `json:"requestId,omitempty"`
	Timestamp       string  `json:"timestamp"`
	ExecutionTimeMs float64 `json:"executionTimeMs,omitempty"`
	APIVersion      string  `json:"apiVersion"`
}

// PaginatedResponse wraps list query results with pagination and metadata envelopes.
type PaginatedResponse struct {
	Data       interface{}    `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
	Meta       ResponseMeta   `json:"meta"`
}

// SingleResponse wraps single-item query/mutation results with metadata.
type SingleResponse struct {
	Data interface{}  `json:"data"`
	Meta ResponseMeta `json:"meta"`
}

// ParsePaginationParams extracts and validates pagination query parameters from the request.
func ParsePaginationParams(r *http.Request) PaginationParams {
	q := r.URL.Query()

	page := 1
	if pStr := q.Get("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}

	pageSize := 20
	if psStr := q.Get("pageSize"); psStr != "" {
		if ps, err := strconv.Atoi(psStr); err == nil && ps > 0 {
			pageSize = ps
		}
	} else if lStr := q.Get("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 {
			pageSize = l
		}
	}

	// Clamp page size between 1 and 100
	if pageSize > 100 {
		pageSize = 100
	}
	if pageSize < 1 {
		pageSize = 1
	}

	return PaginationParams{
		Page:     page,
		PageSize: pageSize,
		Search:   strings.TrimSpace(q.Get("search")),
		Sort:     strings.TrimSpace(q.Get("sort")),
		Category: strings.TrimSpace(q.Get("category")),
		Cursor:   strings.TrimSpace(q.Get("cursor")),
	}
}

// BuildResponseMeta constructs standard response metadata.
func BuildResponseMeta(r *http.Request) ResponseMeta {
	reqID := GetRequestID(r)
	meta := ResponseMeta{
		RequestID:  reqID,
		Timestamp:  time.Now().UTC().Format(time.RFC3339Nano),
		APIVersion: "v1",
	}

	if startTime, ok := r.Context().Value(StartTimeKey).(time.Time); ok {
		meta.ExecutionTimeMs = float64(time.Since(startTime).Microseconds()) / 1000.0
	}

	return meta
}

// GetRequestID returns the request ID from context or header.
func GetRequestID(r *http.Request) string {
	if reqID, ok := r.Context().Value(RequestIDKey).(string); ok && reqID != "" {
		return reqID
	}
	if headerID := r.Header.Get("X-Request-ID"); headerID != "" {
		return headerID
	}
	return ""
}

// RespondJSON writes a standard JSON response with 200/2xx status and metadata envelope.
func RespondJSON(w http.ResponseWriter, r *http.Request, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)

	resp := SingleResponse{
		Data: data,
		Meta: BuildResponseMeta(r),
	}

	_ = json.NewEncoder(w).Encode(resp)
}

// RespondPaginatedJSON writes a standard paginated response with data list and pagination metadata.
// Returns an empty list `[]` when totalCount is 0 (never null).
func RespondPaginatedJSON(w http.ResponseWriter, r *http.Request, data interface{}, totalCount int, params PaginationParams) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)

	totalPages := 0
	if params.PageSize > 0 {
		totalPages = (totalCount + params.PageSize - 1) / params.PageSize
	}

	hasNext := params.Page < totalPages
	hasPrev := params.Page > 1 && totalPages > 0

	var nextPage *int
	if hasNext {
		np := params.Page + 1
		nextPage = &np
	}

	var prevPage *int
	if hasPrev {
		pp := params.Page - 1
		prevPage = &pp
	}

	pagination := PaginationMeta{
		Page:            params.Page,
		PageSize:        params.PageSize,
		TotalCount:      totalCount,
		TotalPages:      totalPages,
		HasNextPage:     hasNext,
		HasPreviousPage: hasPrev,
		NextPage:        nextPage,
		PreviousPage:    prevPage,
	}

	resp := PaginatedResponse{
		Data:       data,
		Pagination: pagination,
		Meta:       BuildResponseMeta(r),
	}

	_ = json.NewEncoder(w).Encode(resp)
}

// RespondCreated writes a 201 Created response with Location header and resource envelope.
func RespondCreated(w http.ResponseWriter, r *http.Request, locationURI string, data interface{}) {
	if locationURI != "" {
		w.Header().Set("Location", locationURI)
	}
	RespondJSON(w, r, http.StatusCreated, data)
}

// RespondNoContent writes a 204 No Content response with empty body.
func RespondNoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// RespondProblem writes an RFC 7807 problem details response with application/problem+json content type.
func RespondProblem(w http.ResponseWriter, r *http.Request, problem ProblemDetail) {
	w.Header().Set("Content-Type", "application/problem+json; charset=utf-8")

	if problem.Type == "" {
		problem.Type = fmt.Sprintf("https://novwrite.com/errors/http-%d", problem.Status)
	}
	if problem.Instance == "" && r != nil {
		problem.Instance = r.URL.Path
	}
	if problem.RequestID == "" && r != nil {
		problem.RequestID = GetRequestID(r)
	}
	if problem.Timestamp == "" {
		problem.Timestamp = time.Now().UTC().Format(time.RFC3339Nano)
	}

	w.WriteHeader(problem.Status)
	_ = json.NewEncoder(w).Encode(problem)
}

// RespondBadRequest writes a 400 Bad Request RFC 7807 problem response.
func RespondBadRequest(w http.ResponseWriter, r *http.Request, detail string, code string) {
	RespondProblem(w, r, ProblemDetail{
		Type:   "https://novwrite.com/errors/bad-request",
		Title:  "Bad Request",
		Status: http.StatusBadRequest,
		Detail: detail,
		Code:   code,
	})
}

// RespondNotFound writes a 404 Not Found RFC 7807 problem response.
func RespondNotFound(w http.ResponseWriter, r *http.Request, resourceName string, id string) {
	RespondProblem(w, r, ProblemDetail{
		Type:   "https://novwrite.com/errors/not-found",
		Title:  "Resource Not Found",
		Status: http.StatusNotFound,
		Detail: fmt.Sprintf("The requested %s with ID '%s' was not found.", resourceName, id),
		Code:   "RESOURCE_NOT_FOUND",
	})
}

// RespondValidationProblem writes a 422/400 validation error response with field-level details.
func RespondValidationProblem(w http.ResponseWriter, r *http.Request, detail string, invalidParams []InvalidParam) {
	RespondProblem(w, r, ProblemDetail{
		Type:          "https://novwrite.com/errors/validation-failed",
		Title:         "Validation Failed",
		Status:        http.StatusUnprocessableEntity,
		Detail:        detail,
		Code:          "VALIDATION_FAILED",
		InvalidParams: invalidParams,
	})
}

// RespondInternalError writes a 500 Internal Server Error RFC 7807 problem response.
func RespondInternalError(w http.ResponseWriter, r *http.Request, detail string) {
	RespondProblem(w, r, ProblemDetail{
		Type:   "https://novwrite.com/errors/internal-server-error",
		Title:  "Internal Server Error",
		Status: http.StatusInternalServerError,
		Detail: detail,
		Code:   "INTERNAL_SERVER_ERROR",
	})
}
