package backend

import (
    "database/sql"
    "errors"
    "fmt"
    "slices"
    "sort"
    "sync"
    "time"

    _ "github.com/go-sql-driver/mysql"
    "github.com/panjf2000/ants/v2"
)

var db *sql.DB
var _config *Config

type Config struct {
    Driver     string `json:"driver"`
    Path       string `json:"path"`
    Username   string `json:"username"`
    Password   string `json:"password"`
    Database   string `json:"database"`
    Threads    []int  `json:"threads"`
    Iterations int    `json:"iterations"`
}

func (c *Config) maxThreads() int {
    return slices.Max(c.Threads)
}

type Result struct {
    Threads int `json:"threads"`
    Max     int `json:"max"`
    Min     int `json:"min"`
    Avg     int `json:"avg"`
    P95     int `json:"p95"`
    P99     int `json:"p99"`
}

type Benchmark struct {
}

func (b Benchmark) TestConnection(config *Config) error {
    _, err := connect(config)
    return err
}

func connect(config *Config) (*sql.DB, error) {
    source := fmt.Sprintf("%s:%s@tcp(%s)/%s", config.Username, config.Password, config.Path, config.Database)
    conn, err := sql.Open(config.Driver, source)
    if err != nil {
        return nil, err
    }
    if err = conn.Ping(); err != nil {
        return nil, err
    }
    return conn, nil
}

func (b Benchmark) InitDB(config *Config) error {
    if db != nil {
        _ = db.Close()
    }
    db = nil
    conn, err := connect(config)
    if err != nil {
        return err
    }

    sort.Ints(config.Threads)
    slices.Reverse(config.Threads)
    conn.SetMaxOpenConns(config.maxThreads())

    db = conn
    db.SetMaxOpenConns(slices.Max(config.Threads))
    _config = config
    return nil
}

func connectionCheck() error {
    if db == nil || _config == nil {
        return errors.New("database not initialized")
    }
    if err := db.Ping(); err != nil {
        err = Benchmark{}.InitDB(_config)
        if err != nil {
            return err
        }
    }
    return nil
}

func initConnections() error {
    if err := connectionCheck(); err != nil {
        return err
    }

    wg := sync.WaitGroup{}
    var err error
    wg.Add(_config.maxThreads())
    for i := 0; i < _config.maxThreads(); i++ {
        go func() {
            defer wg.Done()
            if e := db.Ping(); e != nil {
                err = e
                return
            }
        }()
    }
    wg.Wait()
    return err
}

func (b Benchmark) IsReady() bool {
    return db != nil
}

func (b Benchmark) Run(query string) ([]*Result, error) {
    if err := initConnections(); err != nil {
        return nil, err
    }
    // check sql
    if _, err := exec(query); err != nil {
        return nil, err
    }
    results := make([]*Result, len(_config.Threads))
    for i, thread := range _config.Threads {
        results[i] = bench(query, thread, _config.Iterations)
    }
    return results, nil
}

func bench(query string, threads, iterations int) *Result {
    pool, _ := ants.NewPool(threads, ants.WithPreAlloc(true))
    defer pool.Release()
    responseChan := make(chan int, iterations)
    var wg sync.WaitGroup
    for i := 0; i < iterations; i++ {
        wg.Add(1)
        _ = pool.Submit(func() {
            defer wg.Done()
            t, _ := exec(query)
            responseChan <- t
        })
    }
    wg.Wait()
    close(responseChan)
    times := make([]int, 0, iterations)
    for t := range responseChan {
        times = append(times, t)
    }

    return &Result{
        Threads: threads,
        Max:     slices.Max(times),
        Min:     slices.Min(times),
        Avg:     sum(times) / len(times),
        P95:     calculatePercentiles(times, 0.95),
        P99:     calculatePercentiles(times, 0.99),
    }
}

func exec(query string) (int, error) {
    if db == nil {
        return 0, fmt.Errorf("database not initialized")
    }
    startTime := time.Now()
    res, err := db.Query(query)
    defer res.Close()
    if err != nil {
        return 0, err
    }
    return int(time.Now().Sub(startTime).Milliseconds()), nil
}

func calculatePercentiles(responseTimes []int, val float64) int {
    if len(responseTimes) == 0 {
        return 0
    }

    sort.Ints(responseTimes)
    index := int(float64(len(responseTimes)) * val)

    if index >= len(responseTimes) {
        index = len(responseTimes) - 1
    }
    return responseTimes[index]
}
