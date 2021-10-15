def write ( int ptr int -- ) 
  1 
  syscall3 
end

def sayu ( int -- )
  loop 20 0 for
    10 /mod 48 + 20 i - mem + !
    dup 1 < if
      i 1 +
      mem 20 i - +
      1
      write
      leave
    end
  end
  drop
end

def sayd ( int -- )
  dup 0 < if
    neg
    -1 swap
  else
    0 swap
  end
  loop 20 0 for
    dup 1 < if
      swap dup if
        45 20 i - mem + !
      end
      swap
      i 1 +
      mem 20 i - +
      1
      write
      leave
    end
    10 /mod 48 + 20 i - mem + !
  end
  drop
  drop
end

def sayc ( int -- )
  mem !
  1 mem 1 write
end

def nl ( -- )
  10 sayc
end

def says ( int ptr -- )
  1 write
end

def print ( int ptr -- )
  says nl
end

false if
  "Hello, World!" print
end

